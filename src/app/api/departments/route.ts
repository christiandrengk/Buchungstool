import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true },
  });
  return NextResponse.json(departments);
}
