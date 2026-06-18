import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/bookings/:id
// In v1 ohne Login kann jede Buchung storniert werden (volle Transparenz).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Buchung nicht gefunden." },
      { status: 404 }
    );
  }

  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
