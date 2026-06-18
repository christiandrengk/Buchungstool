// Gemeinsame Typen für API-Antworten (Frontend <-> Backend).

export type Kind = "PLACE" | "DEVICE";
export type Reason = "SOCKEL" | "PUFFER";
export type Role = "STAFF" | "STUDENT";
export type UsageType = "TAKEOUT" | "IN_ROOM";

export interface DepartmentDTO {
  id: number;
  name: string;
  shortName: string | null;
}

export interface ItemAvailabilityDTO {
  id: number;
  label: string;
  note: string | null;
  unavailableReason: Reason | null;
  ownerDepartment: string | null;
  /** Frei im aktuell betrachteten Zeitraum? (nur relevant, wenn buchbar) */
  available: boolean;
}

export interface CategoryAvailabilityDTO {
  id: number;
  name: string;
  kind: Kind;
  description: string | null;
  studentsAllowed: boolean;
  studentsInRoomOnly: boolean;
  ownerDepartment: string | null;
  /** Anzahl Exemplare insgesamt */
  total: number;
  /** Davon grundsätzlich buchbar (ohne Sockel/Puffer) */
  bookable: number;
  /** Davon im betrachteten Zeitraum frei */
  available: number;
  items: ItemAvailabilityDTO[];
}

export interface BookingDTO {
  id: number;
  bookerName: string;
  department: string;
  role: Role;
  usageType: UsageType;
  purpose: string | null;
  startTime: string;
  endTime: string;
  categoryName: string;
  kind: Kind;
  itemLabel: string;
  itemId: number;
}
