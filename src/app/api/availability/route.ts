import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability";

// GET /api/availability?start=ISO&end=ISO
// Ohne start/end: nur Bestandsübersicht (kein "frei im Zeitraum").
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  let start: Date | undefined;
  let end: Date | undefined;

  if (startParam && endParam) {
    start = new Date(startParam);
    end = new Date(endParam);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Ungültiges Datumsformat." },
        { status: 400 }
      );
    }
    if (end <= start) {
      return NextResponse.json(
        { error: "Das Ende muss nach dem Start liegen." },
        { status: 400 }
      );
    }
  }

  const data = await getAvailability(start, end);
  return NextResponse.json(data);
}
