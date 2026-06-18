"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { BookingDTO, CategoryAvailabilityDTO } from "@/lib/types";
import { fetchJSON } from "@/lib/format";
import { BookingsList } from "@/components/BookingsList";
import { Notice, OwnerBadge } from "@/components/common";

export default function OverviewPage() {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [stock, setStock] = useState<CategoryAvailabilityDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        fetchJSON<BookingDTO[]>("/api/bookings?upcoming=true"),
        fetchJSON<CategoryAvailabilityDTO[]>("/api/availability"),
      ]);
      setBookings(b);
      setStock(s);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id: number) => {
    if (!confirm("Diese Buchung wirklich stornieren?")) return;
    try {
      await fetchJSON(`/api/bookings/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const places = stock.filter((c) => c.kind === "PLACE");
  const devices = stock.filter((c) => c.kind === "DEVICE");

  return (
    <div className="space-y-8">
      <section className="card p-5">
        <h1 className="text-xl font-semibold">Übersicht</h1>
        <p className="mt-1 text-sm text-slate-600">
          Alle Buchungen sind für alle sichtbar. Zum Buchen einen{" "}
          <Link className="text-brand underline" href="/plaetze">
            Platz
          </Link>{" "}
          oder ein{" "}
          <Link className="text-brand underline" href="/geraete">
            Gerät
          </Link>{" "}
          wählen.
        </p>
      </section>

      {error && <Notice type="error">{error}</Notice>}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Bestand</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StockCard title="Plätze" categories={places} />
          <StockCard title="Ausleihbare Geräte" categories={devices} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          „buchbar" = Bestand ohne Sockel/Puffer. Aktuelle Verfügbarkeit für
          einen konkreten Zeitraum siehst du auf den Buchungsseiten.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Kommende &amp; laufende Buchungen
        </h2>
        <div className="card">
          {loading ? (
            <p className="px-4 py-6 text-sm text-slate-500">Lädt …</p>
          ) : (
            <BookingsList bookings={bookings} onCancel={cancel} />
          )}
        </div>
      </section>
    </div>
  );
}

function StockCard({
  title,
  categories,
}: {
  title: string;
  categories: CategoryAvailabilityDTO[];
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{c.name}</span>
              <OwnerBadge owner={c.ownerDepartment} />
            </span>
            <span className="shrink-0 text-slate-600">
              {c.bookable} buchbar
              {c.total !== c.bookable && (
                <span className="text-slate-400"> / {c.total} gesamt</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
