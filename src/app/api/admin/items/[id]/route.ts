import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/items/:id
// Body: { unavailableReason: "SOCKEL" | "PUFFER" | null }
// Markiert ein Exemplar als nicht buchbar (Sockel/Puffer) oder gibt es frei.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const reason = body?.unavailableReason ?? null;
  if (reason !== null && reason !== "SOCKEL" && reason !== "PUFFER") {
    return NextResponse.json(
      { error: "unavailableReason muss SOCKEL, PUFFER oder null sein." },
      { status: 400 }
    );
  }

  const existing = await prisma.resourceItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Exemplar nicht gefunden." },
      { status: 404 }
    );
  }

  const updated = await prisma.resourceItem.update({
    where: { id },
    data: { unavailableReason: reason },
  });

  return NextResponse.json({
    id: updated.id,
    unavailableReason: updated.unavailableReason,
  });
}

// DELETE /api/admin/items/:id
// Entfernt ein Exemplar – nur, wenn keine Buchungen daran hängen.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const existing = await prisma.resourceItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Exemplar nicht gefunden." },
      { status: 404 }
    );
  }

  const bookingCount = await prisma.booking.count({
    where: { resourceItemId: id },
  });
  if (bookingCount > 0) {
    return NextResponse.json(
      {
        error: `Nicht löschbar: An diesem Exemplar hängen noch ${bookingCount} Buchung(en). Bitte zuerst stornieren.`,
      },
      { status: 409 }
    );
  }

  await prisma.resourceItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
