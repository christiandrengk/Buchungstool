import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/categories/:id
// Löscht eine Kategorie – nur, wenn sie keine Exemplare mehr enthält.
// (Exemplare wiederum sind nicht löschbar, solange Buchungen daran hängen –
//  so sind bestehende Buchungen automatisch geschützt.)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const category = await prisma.resourceCategory.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json(
      { error: "Kategorie nicht gefunden." },
      { status: 404 }
    );
  }

  const itemCount = await prisma.resourceItem.count({
    where: { categoryId: id },
  });
  if (itemCount > 0) {
    return NextResponse.json(
      {
        error: `Nicht löschbar: Die Kategorie enthält noch ${itemCount} Exemplar(e). Bitte zuerst alle entfernen.`,
      },
      { status: 409 }
    );
  }

  await prisma.resourceCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
