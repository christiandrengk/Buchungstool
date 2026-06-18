"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CategoryAvailabilityDTO } from "@/lib/types";
import {
  defaultLocalInput,
  fetchJSON,
  localInputToISO,
} from "@/lib/format";
import { BookerFields, BookerData, emptyBooker } from "@/components/BookerFields";
import { TimeRange, TimeRangeValue } from "@/components/TimeRange";
import { Notice, OwnerBadge, ReasonBadge } from "@/components/common";

export default function GeraetePage() {
  const [range, setRange] = useState<TimeRangeValue>({
    start: defaultLocalInput(0),
    end: defaultLocalInput(120),
  });
  const [booker, setBooker] = useState<BookerData>(emptyBooker);
  const [categories, setCategories] = useState<CategoryAvailabilityDTO[]>([]);
  // Pro Kategorie gewünschte Anzahl (catId -> Anzahl). 0/fehlt = nicht gewählt.
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rangeValid = useMemo(() => {
    if (!range.start || !range.end) return false;
    return new Date(range.end) > new Date(range.start);
  }, [range]);

  const loadAvailability = useCallback(async () => {
    if (!rangeValid) {
      setCategories([]);
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        start: localInputToISO(range.start),
        end: localInputToISO(range.end),
      });
      const all = await fetchJSON<CategoryAvailabilityDTO[]>(
        `/api/availability?${params.toString()}`
      );
      setCategories(all.filter((c) => c.kind === "DEVICE"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }, [range, rangeValid]);

  useEffect(() => {
    loadAvailability();
    setQuantities({});
  }, [loadAvailability]);

  const setQuantityFor = (catId: number, value: number, max: number) => {
    const q = Math.max(0, Math.min(max, Math.floor(value || 0)));
    setQuantities((prev) => ({ ...prev, [catId]: q }));
  };

  // Gewählte Positionen (Anzahl >= 1).
  const lines = Object.entries(quantities)
    .map(([id, qty]) => ({ categoryId: Number(id), quantity: qty }))
    .filter((l) => l.quantity >= 1);
  const totalSelected = lines.reduce((s, l) => s + l.quantity, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (lines.length === 0) {
      setError("Bitte mindestens ein Gerät (Anzahl ≥ 1) auswählen.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchJSON<{ bookings: unknown[] }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          bookerName: booker.bookerName,
          departmentId: Number(booker.departmentId),
          role: booker.role,
          purpose: booker.purpose,
          start: localInputToISO(range.start),
          end: localInputToISO(range.end),
          lines,
        }),
      });
      setSuccess(
        `${res.bookings.length} Exemplar(e) erfolgreich ausgeliehen.`
      );
      setQuantities({});
      await loadAvailability();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card p-5">
        <h1 className="text-xl font-semibold">Gerät ausleihen</h1>
        <p className="mt-1 text-sm text-slate-600">
          Beliebig viele Kategorien mit Anzahl wählen – das System teilt
          automatisch freie Exemplare zu. Sockel-/Puffer-Geräte sind nicht
          buchbar.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">1. Zeitraum</h2>
        <TimeRange value={range} onChange={setRange} />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">
          2. Geräte auswählen{" "}
          <span className="font-normal text-slate-400">
            (mehrere Kategorien möglich)
          </span>
        </h2>
        {!rangeValid ? (
          <p className="text-sm text-slate-500">
            Bitte zuerst einen gültigen Zeitraum wählen.
          </p>
        ) : checking ? (
          <p className="text-sm text-slate-500">Prüfe Verfügbarkeit …</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => {
              const none = cat.available === 0;
              const qty = quantities[cat.id] ?? 0;
              const active = qty >= 1;
              return (
                <div
                  key={cat.id}
                  className={[
                    "flex flex-col gap-2 rounded-md border px-4 py-3 transition sm:flex-row sm:items-center sm:justify-between",
                    active
                      ? "border-brand bg-brand/5 ring-1 ring-brand"
                      : "border-slate-200",
                    none ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{cat.name}</span>
                      <OwnerBadge owner={cat.ownerDepartment} />
                      {!cat.studentsAllowed && (
                        <span className="badge bg-rose-100 text-rose-700">
                          nicht für Studierende (später)
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-400">{cat.description}</p>
                    )}
                    <div className="mt-1 text-sm">
                      <span
                        className={
                          none ? "text-red-500" : "font-medium text-green-600"
                        }
                      >
                        {cat.available} frei
                      </span>{" "}
                      <span className="text-slate-400">
                        / {cat.bookable} buchbar / {cat.total} gesamt
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <label
                      className="text-sm text-slate-600"
                      htmlFor={`qty-${cat.id}`}
                    >
                      Anzahl
                    </label>
                    <input
                      id={`qty-${cat.id}`}
                      type="number"
                      className="input w-20"
                      min={0}
                      max={cat.available}
                      disabled={none}
                      value={qty}
                      onChange={(e) =>
                        setQuantityFor(
                          cat.id,
                          Number(e.target.value),
                          cat.available
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalSelected > 0 && (
          <p className="mt-3 text-sm font-medium text-slate-700">
            Ausgewählt: {totalSelected} Exemplar(e) aus {lines.length}{" "}
            Kategorie(n).
          </p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">3. Deine Angaben</h2>
        <BookerFields value={booker} onChange={setBooker} />
      </section>

      {error && <Notice type="error">{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || lines.length === 0}
        >
          {submitting
            ? "Buche …"
            : totalSelected > 1
              ? `${totalSelected} Geräte ausleihen`
              : "Gerät ausleihen"}
        </button>
      </div>
    </form>
  );
}
