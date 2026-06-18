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

      // Überschneidungsprüfung für ein konkretes Exemplar (innerhalb der Transaktion).
      const isFree = async (itemId: number) => {
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

      const createdItemIds: number[] = [];

      if (input.resourceItemId !== undefined) {
        // --- Platzbuchung / Buchung eines konkreten Exemplars ---
        const item = await tx.resourceItem.findUnique({
          where: { id: input.resourceItemId },
        });
        if (!item) throw new BadRequestError("Unbekanntes Exemplar.");
        if (item.unavailableReason !== null) {
          throw new BadRequestError(
            "Dieses Exemplar ist nicht buchbar (Sockel/Puffer)."
          );
        }
        if (!(await isFree(item.id))) {
          throw new BookingConflictError(
            "Dieser Zeitraum überschneidet sich mit einer bestehenden Buchung."
          );
        }
        createdItemIds.push(item.id);
      } else {
        // --- Geräteausleihe mit Auto-Zuteilung ---
        const categoryId = input.categoryId!;
        const quantity = input.quantity!;
        const category = await tx.resourceCategory.findUnique({
          where: { id: categoryId },
        });
        if (!category) throw new BadRequestError("Unbekannte Kategorie.");

        const candidates = await tx.resourceItem.findMany({
          where: { categoryId, unavailableReason: null },
          orderBy: { id: "asc" },
          select: { id: true },
        });

        for (const c of candidates) {
          if (await isFree(c.id)) {
            createdItemIds.push(c.id);
            if (createdItemIds.length >= quantity) break;
          }
        }

        if (createdItemIds.length < quantity) {
          throw new BookingConflictError(
            `Nicht genügend freie Exemplare: ${createdItemIds.length} von ${quantity} verfügbar.`
          );
        }
      }

      // Buchungen anlegen.
      const created = [];
      for (const itemId of createdItemIds) {
        const b = await tx.booking.create({
          data: {
            resourceItemId: itemId,
            bookerName: input.bookerName,
            departmentId: input.departmentId,
            role: input.role,
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
