import { NextResponse } from "next/server";
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
