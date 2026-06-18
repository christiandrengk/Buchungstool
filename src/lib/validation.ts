// Gemeinsame Eingabevalidierung für Buchungen.
//
// Eine Buchung besteht aus gemeinsamen Angaben (Name, Abteilung, Zeitraum) und
// einer oder mehreren "Positionen" (lines). Jede Position ist entweder
//   - ein konkretes Exemplar (Platzbuchung):      { resourceItemId }
//   - eine Kategorie + Anzahl (Geräteausleihe):   { categoryId, quantity }
// So lassen sich mehrere Plätze und/oder Geräte in EINEM Vorgang buchen.

export interface BookingLine {
  resourceItemId?: number;
  categoryId?: number;
  quantity?: number;
}

export interface ParsedBookingInput {
  bookerName: string;
  bookerEmail: string;
  departmentId: number;
  role: "STAFF" | "STUDENT";
  usageType: "TAKEOUT" | "IN_ROOM";
  purpose: string | null;
  start: Date;
  end: Date;
  lines: BookingLine[];
}

// Maximale Ausleihdauer für Studierende (Kalendertage).
export const STUDENT_MAX_DAYS = 7;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Anzahl angebrochener Kalendertage zwischen Start und Ende (aufgerundet). */
export function calendarDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export type ValidationResult =
  | { ok: true; value: ParsedBookingInput }
  | { ok: false; error: string };

function parseLine(raw: any): { ok: true; line: BookingLine } | { ok: false; error: string } {
  const hasItem = raw?.resourceItemId !== undefined && raw?.resourceItemId !== null;
  const hasCategory = raw?.categoryId !== undefined && raw?.categoryId !== null;

  if (hasItem === hasCategory) {
    return {
      ok: false,
      error: "Jede Position braucht entweder ein Exemplar ODER eine Kategorie mit Anzahl.",
    };
  }

  if (hasItem) {
    const resourceItemId = Number(raw.resourceItemId);
    if (!Number.isInteger(resourceItemId) || resourceItemId <= 0) {
      return { ok: false, error: "Ungültiges Exemplar." };
    }
    return { ok: true, line: { resourceItemId } };
  }

  const categoryId = Number(raw.categoryId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { ok: false, error: "Ungültige Kategorie." };
  }
  const quantity = Number(raw.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    return { ok: false, error: "Ungültige Anzahl (1–50)." };
  }
  return { ok: true, line: { categoryId, quantity } };
}

export function parseBookingInput(body: any): ValidationResult {
  const bookerName = String(body?.bookerName ?? "").trim();
  if (!bookerName) return { ok: false, error: "Bitte einen Namen angeben." };

  const bookerEmail = String(body?.bookerEmail ?? "").trim();
  if (!bookerEmail) return { ok: false, error: "Bitte eine E-Mail-Adresse angeben." };
  if (!EMAIL_RE.test(bookerEmail)) {
    return { ok: false, error: "Bitte eine gültige E-Mail-Adresse angeben." };
  }

  const departmentId = Number(body?.departmentId);
  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { ok: false, error: "Bitte eine Abteilung auswählen." };
  }

  const role = body?.role === "STUDENT" ? "STUDENT" : "STAFF";
  const usageType = body?.usageType === "IN_ROOM" ? "IN_ROOM" : "TAKEOUT";
  const purpose = body?.purpose ? String(body.purpose).trim() || null : null;

  const start = new Date(body?.start);
  const end = new Date(body?.end);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { ok: false, error: "Bitte gültige Start- und Endzeit angeben." };
  }
  if (end <= start) {
    return { ok: false, error: "Das Ende muss nach dem Start liegen." };
  }

  // Studierende: maximale Ausleih-/Buchungsdauer.
  if (role === "STUDENT" && calendarDays(start, end) > STUDENT_MAX_DAYS) {
    return {
      ok: false,
      error: `Studierende können maximal ${STUDENT_MAX_DAYS} Kalendertage buchen.`,
    };
  }

  // Positionen einsammeln: entweder body.lines[] oder eine einzelne Position
  // direkt im Body (Abwärtskompatibilität).
  const rawLines: any[] = Array.isArray(body?.lines)
    ? body.lines
    : [{ resourceItemId: body?.resourceItemId, categoryId: body?.categoryId, quantity: body?.quantity }];

  if (rawLines.length === 0) {
    return { ok: false, error: "Bitte mindestens einen Platz oder ein Gerät auswählen." };
  }

  const lines: BookingLine[] = [];
  for (const raw of rawLines) {
    const parsed = parseLine(raw);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    lines.push(parsed.line);
  }

  return {
    ok: true,
    value: {
      bookerName,
      bookerEmail,
      departmentId,
      role,
      usageType,
      purpose,
      start,
      end,
      lines,
    },
  };
}
