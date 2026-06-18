// Gemeinsame Eingabevalidierung für Buchungen.

export interface ParsedBookingInput {
  bookerName: string;
  departmentId: number;
  role: "STAFF" | "STUDENT";
  purpose: string | null;
  start: Date;
  end: Date;
  // Entweder ein konkretes Exemplar (Platzbuchung) ...
  resourceItemId?: number;
  // ... oder Kategorie + Anzahl (Geräteausleihe mit Auto-Zuteilung).
  categoryId?: number;
  quantity?: number;
}

export type ValidationResult =
  | { ok: true; value: ParsedBookingInput }
  | { ok: false; error: string };

export function parseBookingInput(body: any): ValidationResult {
  const bookerName = String(body?.bookerName ?? "").trim();
  if (!bookerName) return { ok: false, error: "Bitte einen Namen angeben." };

  const departmentId = Number(body?.departmentId);
  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { ok: false, error: "Bitte eine Abteilung auswählen." };
  }

  const role = body?.role === "STUDENT" ? "STUDENT" : "STAFF";
  const purpose = body?.purpose ? String(body.purpose).trim() || null : null;

  const start = new Date(body?.start);
  const end = new Date(body?.end);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { ok: false, error: "Bitte gültige Start- und Endzeit angeben." };
  }
  if (end <= start) {
    return { ok: false, error: "Das Ende muss nach dem Start liegen." };
  }

  const hasItem =
    body?.resourceItemId !== undefined && body?.resourceItemId !== null;
  const hasCategory =
    body?.categoryId !== undefined && body?.categoryId !== null;

  if (hasItem === hasCategory) {
    return {
      ok: false,
      error: "Entweder ein Exemplar ODER eine Kategorie mit Anzahl angeben.",
    };
  }

  const value: ParsedBookingInput = {
    bookerName,
    departmentId,
    role,
    purpose,
    start,
    end,
  };

  if (hasItem) {
    const resourceItemId = Number(body.resourceItemId);
    if (!Number.isInteger(resourceItemId) || resourceItemId <= 0) {
      return { ok: false, error: "Ungültiges Exemplar." };
    }
    value.resourceItemId = resourceItemId;
  } else {
    const categoryId = Number(body.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return { ok: false, error: "Ungültige Kategorie." };
    }
    const quantity = Number(body.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return { ok: false, error: "Ungültige Anzahl (1–50)." };
    }
    value.categoryId = categoryId;
    value.quantity = quantity;
  }

  return { ok: true, value };
}
