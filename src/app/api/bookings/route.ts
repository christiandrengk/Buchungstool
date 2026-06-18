import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseBookingInput } from "@/lib/validation";
import type { BookingDTO } from "@/lib/types";

// Fehler, der zu einem Konflikt (409) führt.
class BookingConflictError extends Error {}
class BadRequestError extends Error {}

// GET /api/bookings?upcoming=true
// Listet alle Buchungen (volle Transparenz für alle).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";

  const bookings = await prisma.booking.findMany({
    where: upcoming ? { endTime: { gte: new Date() } } : undefined,
    orderBy: { startTime: "asc" },
    include: {
      department: true,
      resourceItem: { include: { category: true } },
    },
  });

  const data: BookingDTO[] = bookings.map((b) => ({
    id: b.id,
    bookerName: b.bookerName,
    department: b.department.shortName ?? b.department.name,
    role: b.role as BookingDTO["role"],
    usageType: b.usageType as BookingDTO["usageType"],
    purpose: b.purpose,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    categoryName: b.resourceItem.category.name,
    kind: b.resourceItem.category.kind as BookingDTO["kind"],
    itemLabel: b.resourceItem.label,
    itemId: b.resourceItem.id,
  }));

  return NextResponse.json(data);
}

// POST /api/bookings
// Body (Platz):   { bookerName, departmentId, role?, purpose?, start, end, resourceItemId }
// Body (Gerät):   { bookerName, departmentId, role?, purpose?, start, end, categoryId, quantity }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const parsed = parseBookingInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed.value;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const department = await tx.department.findUnique({
        where: { id: input.departmentId },
      });
      if (!department) throw new BadRequestError("Unbekannte Abteilung.");

      // Bereits in DIESEM Vorgang reservierte Exemplare (damit dasselbe Stück
      // nicht doppelt zugeteilt wird).
      const usedIds = new Set<number>();

      // Überschneidungsprüfung für ein konkretes Exemplar (innerhalb der
      // Transaktion und unter Berücksichtigung der schon reservierten Stücke).
      const isFree = async (itemId: number) => {
        if (usedIds.has(itemId)) return false;
        const conflict = await tx.booking.findFirst({
          where: {
            resourceItemId: itemId,
            startTime: { lt: input.end },
            endTime: { gt: input.start },
          },
          select: { id: true },
        });
        return conflict === null;
      };

      // Studierenden-Regeln je Kategorie prüfen (in v1 anhand selbst
      // gewählter Rolle; serverseitig durchgesetzt).
      const checkStudentRule = (cat: {
        name: string;
        studentsAllowed: boolean;
        studentsInRoomOnly: boolean;
      }) => {
        if (input.role !== "STUDENT") return;
        if (!cat.studentsAllowed) {
          throw new BadRequestError(
            `"${cat.name}" ist für Studierende nicht buchbar.`
          );
        }
        if (cat.studentsInRoomOnly && input.usageType === "TAKEOUT") {
          throw new BadRequestError(
            `"${cat.name}" dürfen Studierende nur zur Nutzung im Raum buchen, nicht ausleihen.`
          );
        }
      };

      // Alle Positionen in konkrete Exemplar-IDs auflösen.
      for (const line of input.lines) {
        if (line.resourceItemId !== undefined) {
          // --- Konkretes Exemplar (Platz) ---
          const item = await tx.resourceItem.findUnique({
            where: { id: line.resourceItemId },
            include: { category: true },
          });
          if (!item) throw new BadRequestError("Unbekanntes Exemplar.");
          if (item.unavailableReason !== null) {
            throw new BadRequestError(
              `"${item.label}" ist nicht buchbar (Sockel/Puffer).`
            );
          }
          checkStudentRule(item.category);
          if (usedIds.has(item.id)) {
            throw new BadRequestError(`"${item.label}" wurde doppelt ausgewählt.`);
          }
          if (!(await isFree(item.id))) {
            throw new BookingConflictError(
              `"${item.label}" ist im gewählten Zeitraum bereits belegt.`
            );
          }
          usedIds.add(item.id);
        } else {
          // --- Kategorie + Anzahl (Geräte, Auto-Zuteilung) ---
          const categoryId = line.categoryId!;
          const quantity = line.quantity!;
          const category = await tx.resourceCategory.findUnique({
            where: { id: categoryId },
          });
          if (!category) throw new BadRequestError("Unbekannte Kategorie.");
          checkStudentRule(category);

          const candidates = await tx.resourceItem.findMany({
            where: { categoryId, unavailableReason: null },
            orderBy: { id: "asc" },
            select: { id: true },
          });

          let assigned = 0;
          for (const c of candidates) {
            if (await isFree(c.id)) {
              usedIds.add(c.id);
              assigned++;
              if (assigned >= quantity) break;
            }
          }

          if (assigned < quantity) {
            throw new BookingConflictError(
              `${category.name}: nur ${assigned} von ${quantity} im gewählten Zeitraum frei.`
            );
          }
        }
      }

      const createdItemIds = Array.from(usedIds);

      // Buchungen anlegen.
      const created = [];
      for (const itemId of createdItemIds) {
        const b = await tx.booking.create({
          data: {
            resourceItemId: itemId,
            bookerName: input.bookerName,
            bookerEmail: input.bookerEmail,
            departmentId: input.departmentId,
            role: input.role,
            usageType: input.usageType,
            purpose: input.purpose,
            startTime: input.start,
            endTime: input.end,
          },
          include: {
            department: true,
            resourceItem: { include: { category: true } },
          },
        });
        created.push(b);
      }
      return created;
    });

    const data: BookingDTO[] = result.map((b) => ({
      id: b.id,
      bookerName: b.bookerName,
      department: b.department.shortName ?? b.department.name,
      role: b.role as BookingDTO["role"],
      usageType: b.usageType as BookingDTO["usageType"],
      purpose: b.purpose,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      categoryName: b.resourceItem.category.name,
      kind: b.resourceItem.category.kind as BookingDTO["kind"],
      itemLabel: b.resourceItem.label,
      itemId: b.resourceItem.id,
    }));

    return NextResponse.json({ bookings: data }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof BadRequestError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Datenbankfehler bei der Buchung." },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Unerwarteter Fehler bei der Buchung." },
      { status: 500 }
    );
  }
}
