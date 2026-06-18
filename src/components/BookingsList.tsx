"use client";

import type { BookingDTO } from "@/lib/types";
import { formatRange } from "@/lib/format";
import { KindBadge } from "./common";

export function BookingsList({
  bookings,
  onCancel,
}: {
  bookings: BookingDTO[];
  onCancel?: (id: number) => void;
}) {
  if (bookings.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-slate-500">
        Keine Buchungen vorhanden.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {bookings.map((b) => (
        <li
          key={b.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge kind={b.kind} />
              <span className="font-medium text-slate-900">
                {b.categoryName}
              </span>
              <span className="text-sm text-slate-500">· {b.itemLabel}</span>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {formatRange(b.startTime, b.endTime)}
            </div>
            <div className="text-sm text-slate-500">
              {b.bookerName} · {b.department}
              {b.purpose ? ` · ${b.purpose}` : ""}
            </div>
          </div>
          {onCancel && (
            <button
              className="btn-danger shrink-0"
              onClick={() => onCancel(b.id)}
            >
              Stornieren
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
