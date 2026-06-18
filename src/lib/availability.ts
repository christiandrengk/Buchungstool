import { prisma } from "@/lib/prisma";
import type { CategoryAvailabilityDTO, Kind, Reason } from "@/lib/types";

/**
 * Zwei Zeiträume überschneiden sich, wenn der eine beginnt, bevor der andere
 * endet – und umgekehrt. Aneinandergrenzende Buchungen (Ende == Start) gelten
 * NICHT als Überschneidung.
 */
export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Prüft, ob ein konkretes Exemplar im Zeitraum frei ist.
 * Optional kann eine Buchung (excludeBookingId) ausgenommen werden.
 */
export async function isItemFree(
  resourceItemId: number,
  start: Date,
  end: Date,
  excludeBookingId?: number
): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
    where: {
      resourceItemId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      // Überschneidung: existierender Start < neues Ende UND existierendes Ende > neuer Start
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: { id: true },
  });
  return conflict === null;
}

/**
 * Findet bis zu `quantity` freie, buchbare Exemplare einer Kategorie im
 * Zeitraum und gibt deren IDs zurück (Auto-Zuteilung).
 */
export async function findFreeItemsForCategory(
  categoryId: number,
  start: Date,
  end: Date,
  quantity: number
): Promise<number[]> {
  const items = await prisma.resourceItem.findMany({
    where: { categoryId, unavailableReason: null },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  const free: number[] = [];
  for (const item of items) {
    if (await isItemFree(item.id, start, end)) {
      free.push(item.id);
      if (free.length >= quantity) break;
    }
  }
  return free;
}

/**
 * Liefert die Verfügbarkeitsübersicht aller Kategorien für einen Zeitraum.
 * Wird ohne Zeitraum aufgerufen, zählt es nur Bestand (kein "available").
 */
export async function getAvailability(
  start?: Date,
  end?: Date
): Promise<CategoryAvailabilityDTO[]> {
  const categories = await prisma.resourceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      ownerDepartment: true,
      items: {
        orderBy: { id: "asc" },
        include: { ownerDepartment: true },
      },
    },
  });

  const hasRange = !!start && !!end;

  const result: CategoryAvailabilityDTO[] = [];
  for (const cat of categories) {
    let availableCount = 0;
    const items = [];
    for (const item of cat.items) {
      const bookable = item.unavailableReason === null;
      let available = false;
      if (hasRange && bookable) {
        available = await isItemFree(item.id, start!, end!);
        if (available) availableCount++;
      }
      items.push({
        id: item.id,
        label: item.label,
        note: item.note,
        unavailableReason: item.unavailableReason as Reason | null,
        ownerDepartment:
          item.ownerDepartment?.shortName ?? item.ownerDepartment?.name ?? null,
        available,
      });
    }

    const bookableCount = cat.items.filter(
      (i) => i.unavailableReason === null
    ).length;

    result.push({
      id: cat.id,
      name: cat.name,
      kind: cat.kind as Kind,
      description: cat.description,
      studentsAllowed: cat.studentsAllowed,
      studentsInRoomOnly: cat.studentsInRoomOnly,
      ownerDepartment:
        cat.ownerDepartment?.shortName ?? cat.ownerDepartment?.name ?? null,
      total: cat.items.length,
      bookable: bookableCount,
      available: hasRange ? availableCount : bookableCount,
      items,
    });
  }
  return result;
}
