"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CategoryAvailabilityDTO } from "@/lib/types";
import {
  fetchJSON,
  localInputToISO,
} from "@/lib/format";
import { BookerFields, BookerData, emptyBooker } from "@/components/BookerFields";
import { DayRangePicker, DayRangeValue } from "@/components/DayRangePicker";
import { Notice, ReasonBadge } from "@/components/common";

export default function PlaetzePage() {
  const [range, setRange] = useState<DayRangeValue>({ start: "", end: "" });
  const [booker, setBooker] = useState<BookerData>(emptyBooker);
  const [categories, setCategories] = useState<CategoryAvailabilityDTO[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
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
      setCategories(all.filter((c) => c.kind === "PLACE"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }, [range, rangeValid]);

  useEffect(() => {
    loadAvailability();
    setSelectedItemIds([]);
  }, [loadAvailability]);

  const toggleItem = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (selectedItemIds.length === 0) {
      setError("Bitte mindestens einen freien Platz auswählen.");
      return;
    }
    setSubmitting(true);
    try {
      await fetchJSON("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          bookerName: booker.bookerName,
          departmentId: Number(booker.departmentId),
          role: booker.role,
          purpose: booker.purpose,
          start: localInputToISO(range.start),
          end: localInputToISO(range.end),
          lines: selectedItemIds.map((id) => ({ resourceItemId: id })),
        }),
      });
      setSuccess(
        `${selectedItemIds.length} Platz/Plätze erfolgreich gebucht.`
      );
      setSelectedItemIds([]);
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
        <h1 className="text-xl font-semibold">Platz buchen</h1>
        <p className="mt-1 text-sm text-slate-600">
          4 Testplätze + 2 Arbeitsplätze, stundenweise mit konkreter Uhrzeit.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">1. Zeitraum</h2>
        <DayRangePicker value={range} onChange={setRange} />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">
          2. Plätze auswählen{" "}
          <span className="font-normal text-slate-400">
            (mehrere möglich)
          </span>
        </h2>
        {!rangeValid ? (
          <p className="text-sm text-slate-500">
            Bitte zuerst einen gültigen Zeitraum wählen.
          </p>
        ) : checking ? (
          <p className="text-sm text-slate-500">Prüfe Verfügbarkeit …</p>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat.id}>
                <h3 className="text-sm font-semibold text-slate-700">
                  {cat.name}{" "}
                  <span className="font-normal text-slate-400">
                    ({cat.available} von {cat.bookable} frei)
                  </span>
                </h3>
                {cat.description && (
                  <p className="mb-2 text-xs text-slate-400">
                    {cat.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {cat.items.map((item) => {
                    const blocked = item.unavailableReason !== null;
                    const selectable = !blocked && item.available;
                    const selected = selectedItemIds.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        disabled={!selectable}
                        onClick={() => toggleItem(item.id)}
                        className={[
                          "rounded-md border px-3 py-2 text-left text-sm transition",
                          selected
                            ? "border-brand bg-brand/10 ring-1 ring-brand"
                            : selectable
                              ? "border-slate-300 bg-white hover:border-brand"
                              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
                        ].join(" ")}
                      >
                        <div className="font-medium">{item.label}</div>
                        <div className="mt-0.5 text-xs">
                          {blocked ? (
                            <ReasonBadge reason={item.unavailableReason} />
                          ) : item.available ? (
                            <span className="text-green-600">frei</span>
                          ) : (
                            <span className="text-red-500">belegt</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
          disabled={submitting || selectedItemIds.length === 0}
        >
          {submitting
            ? "Buche …"
            : selectedItemIds.length > 1
              ? `${selectedItemIds.length} Plätze buchen`
              : "Platz buchen"}
        </button>
      </div>
    </form>
  );
}
