import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// POST /api/admin/categories
// Legt eine neue Kategorie an.
// Body: { name, kind: "PLACE"|"DEVICE", description?, ownerDepartmentId?, studentsAllowed? }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { error: "Bitte einen Namen für die Kategorie angeben." },
      { status: 400 }
    );
  }

  const kind = body?.kind === "PLACE" ? "PLACE" : "DEVICE";
  const description = body?.description
    ? String(body.description).trim() || null
    : null;
  const studentsAllowed = body?.studentsAllowed !== false; // Default true
  const studentsInRoomOnly = body?.studentsInRoomOnly === true; // Default false

  let ownerDepartmentId: number | null = null;
  if (
    body?.ownerDepartmentId !== undefined &&
    body?.ownerDepartmentId !== null &&
    body?.ownerDepartmentId !== ""
  ) {
    ownerDepartmentId = Number(body.ownerDepartmentId);
    if (!Number.isInteger(ownerDepartmentId) || ownerDepartmentId <= 0) {
      return NextResponse.json({ error: "Ungültige Abteilung." }, { status: 400 });
    }
    const dep = await prisma.department.findUnique({
      where: { id: ownerDepartmentId },
    });
    if (!dep) {
      return NextResponse.json(
        { error: "Abteilung nicht gefunden." },
        { status: 404 }
      );
    }
  }

  // Neue Kategorie ans Ende sortieren.
  const max = await prisma.resourceCategory.aggregate({
    _max: { sortOrder: true },
  });
  const sortOrder = (max._max.sortOrder ?? 0) + 1;

  try {
    const category = await prisma.resourceCategory.create({
      data: {
        name,
        kind,
        description,
        studentsAllowed,
        studentsInRoomOnly,
        ownerDepartmentId,
        sortOrder,
      },
    });
    return NextResponse.json(
      {
        id: category.id,
        name: category.name,
        kind: category.kind,
        items: [],
      },
      { status: 201 }
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: `Es gibt bereits eine Kategorie namens „${name}".` },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Unerwarteter Fehler beim Anlegen." },
      { status: 500 }
    );
  }
}
