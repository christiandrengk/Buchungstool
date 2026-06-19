"use client";

import { useEffect, useState } from "react";
import type { DepartmentDTO } from "@/lib/types";
import { fetchJSON } from "@/lib/format";

export interface BookerData {
  bookerName: string;
  bookerEmail: string;
  departmentId: string;
  role: "STAFF" | "STUDENT";
  purpose: string;
}

export const emptyBooker: BookerData = {
  bookerName: "",
  bookerEmail: "",
  departmentId: "",
  role: "STAFF",
  purpose: "",
};

/**
 * Wiederverwendbare Pflichtfelder Name + Abteilung (+ optional Rolle/Zweck).
 * Die Rollenauswahl ist vorhanden, in v1 aber ohne Zugangsbeschränkung.
 */
export function BookerFields({
  value,
  onChange,
}: {
  value: BookerData;
  onChange: (v: BookerData) => void;
}) {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);

  useEffect(() => {
    fetchJSON<DepartmentDTO[]>("/api/departments")
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const set = (patch: Partial<BookerData>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="bookerName">
          Name *
        </label>
        <input
          id="bookerName"
          className="input"
          required
          value={value.bookerName}
          onChange={(e) => set({ bookerName: e.target.value })}
          placeholder="Vor- und Nachname"
        />
      </div>

      <div>
        <label className="label" htmlFor="bookerEmail">
          E-Mail (optional)
        </label>
        <input
          id="bookerEmail"
          type="email"
          className="input"
          value={value.bookerEmail}
          onChange={(e) => set({ bookerEmail: e.target.value })}
          placeholder="name@uni-...de"
        />
        <p className="mt-1 text-xs text-slate-400">
          Optional – für Buchungsbestätigung und Erinnerung an die Rückgabe.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="departmentId">
          Abteilung *
        </label>
        <select
          id="departmentId"
          className="select"
          required
          value={value.departmentId}
          onChange={(e) => set({ departmentId: e.target.value })}
        >
          <option value="" disabled>
            Bitte auswählen …
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.shortName && d.shortName !== d.name ? ` (${d.shortName})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="role">
          Nutzergruppe
        </label>
        <select
          id="role"
          className="select"
          value={value.role}
          onChange={(e) =>
            set({ role: e.target.value as "STAFF" | "STUDENT" })
          }
        >
          <option value="STAFF">Mitarbeitende</option>
          <option value="STUDENT">Studierende</option>
        </select>
        <p className="mt-1 text-xs text-slate-400">
          In v1 ohne Zugangsbeschränkung (für spätere Rollenlogik vorbereitet).
        </p>
      </div>

      <div>
        <label className="label" htmlFor="purpose">
          Zweck (optional)
        </label>
        <input
          id="purpose"
          className="input"
          value={value.purpose}
          onChange={(e) => set({ purpose: e.target.value })}
          placeholder="z. B. Testreihe, Aufnahme …"
        />
      </div>
    </div>
  );
}
