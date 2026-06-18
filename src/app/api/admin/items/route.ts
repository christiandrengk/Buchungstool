import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/items
// Liefert alle Exemplare gruppiert nach Kategorie für die Admin-Pflege.
export async function GET() {
  const categories = await prisma.resourceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: { ownerDepartment: true },
      },
    },
  });

  const data = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    kind: cat.kind,
    items: cat.items.map((i) => ({
      id: i.id,
      label: i.label,
      note: i.note,
      unavailableReason: i.unavailableReason,
      ownerDepartment:
        i.ownerDepartment?.shortName ?? i.ownerDepartment?.name ?? null,
    })),
  }));

  return NextResponse.json(data);
}

// POST /api/admin/items
// Legt ein neues Exemplar an.
// Body: { categoryId, label, ownerDepartmentId?: number | null }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const categoryId = Number(body?.categoryId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return NextResponse.json({ error: "Ungültige Kategorie." }, { status: 400 });
  }

  const label = String(body?.label ?? "").trim();
  if (!label) {
    return NextResponse.json(
      { error: "Bitte eine Modell-/Gerätebezeichnung angeben." },
      { status: 400 }
    );
  }

  let ownerDepartmentId: number | null = null;
  if (body?.ownerDepartmentId !== undefined && body?.ownerDepartmentId !== null && body?.ownerDepartmentId !== "") {
    ownerDepartmentId = Number(body.ownerDepartmentId);
    if (!Number.isInteger(ownerDepartmentId) || ownerDepartmentId <= 0) {
      return NextResponse.json({ error: "Ungültige Abteilung." }, { status: 400 });
    }
  }

  const category = await prisma.resourceCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "Kategorie nicht gefunden." }, { status: 404 });
  }

  if (ownerDepartmentId !== null) {
    const dep = await prisma.department.findUnique({ where: { id: ownerDepartmentId } });
    if (!dep) {
      return NextResponse.json({ error: "Abteilung nicht gefunden." }, { status: 404 });
    }
  }

  const item = await prisma.resourceItem.create({
    data: { categoryId, label, ownerDepartmentId },
    include: { ownerDepartment: true },
  });

  return NextResponse.json(
    {
      id: item.id,
      label: item.label,
      note: item.note,
      unavailableReason: item.unavailableReason,
      ownerDepartment:
        item.ownerDepartment?.shortName ?? item.ownerDepartment?.name ?? null,
    },
    { status: 201 }
  );
}
