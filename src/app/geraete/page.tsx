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
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
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
    setSelectedCat(null);
    setQuantity(1);
  }, [loadAvailability]);

  const selectedCategory = categories.find((c) => c.id === selectedCat) ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedCat) {
      setError("Bitte eine Gerätekategorie auswählen.");
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
          categoryId: selectedCat,
          quantity,
        }),
      });
      setSuccess(
        `${res.bookings.length} Exemplar(e) erfolgreich ausgeliehen.`
      );
      setSelectedCat(null);
      setQuantity(1);
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
          Kategorie und Anzahl wählen – das System teilt automatisch freie
          Exemplare zu. Sockel-/Puffer-Geräte sind nicht buchbar.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">1. Zeitraum</h2>
        <TimeRange value={range} onChange={setRange} />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">2. Gerätekategorie auswählen</h2>
        {!rangeValid ? (
          <p className="text-sm text-slate-500">
            Bitte zuerst einen gültigen Zeitraum wählen.
          </p>
        ) : checking ? (
          <p className="text-sm text-slate-500">Prüfe Verfügbarkeit …</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => {
              const selected = selectedCat === cat.id;
              const none = cat.available === 0;
              return (
                <label
                  key={cat.id}
                  className={[
                    "flex cursor-pointer flex-col gap-1 rounded-md border px-4 py-3 transition sm:flex-row sm:items-center sm:justify-between",
                    selected
                      ? "border-brand bg-brand/5 ring-1 ring-brand"
                      : "border-slate-200 hover:border-brand",
                    none ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="category"
                      className="mt-1"
                      checked={selected}
                      disabled={none}
                      onChange={() => {
                        setSelectedCat(cat.id);
                        setQuantity(1);
                      }}
                    />
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
                        <p className="text-xs text-slate-400">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm text-slate-600">
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
                </label>
              );
            })}
          </div>
        )}

        {selectedCategory && (
          <div className="mt-4 max-w-xs">
            <label className="label" htmlFor="quantity">
              Anzahl ({selectedCategory.available} frei)
            </label>
            <input
              id="quantity"
              type="number"
              className="input"
              min={1}
              max={selectedCategory.available}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(
                    1,
                    Math.min(
                      selectedCategory.available,
                      Number(e.target.value) || 1
                    )
                  )
                )
              }
            />
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
          disabled={submitting || !selectedCat}
        >
          {submitting ? "Buche …" : "Gerät(e) ausleihen"}
        </button>
      </div>
    </form>
  );
}
