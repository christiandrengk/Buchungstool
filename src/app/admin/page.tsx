"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/format";
import { Notice, OwnerBadge } from "@/components/common";
import type { Reason } from "@/lib/types";

interface AdminItem {
  id: number;
  label: string;
  note: string | null;
  unavailableReason: Reason | null;
  ownerDepartment: string | null;
}
interface AdminCategory {
  id: number;
  name: string;
  kind: "PLACE" | "DEVICE";
  items: AdminItem[];
}

export default function AdminPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJSON<AdminCategory[]>("/api/admin/items");
      setCategories(data);
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

  const setReason = async (item: AdminItem, reason: Reason | null) => {
    setSavingId(item.id);
    setError(null);
    try {
      await fetchJSON(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ unavailableReason: reason }),
      });
      // lokal aktualisieren
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.map((i) =>
            i.id === item.id ? { ...i, unavailableReason: reason } : i
          ),
        }))
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-xl font-semibold">Verwaltung</h1>
        <p className="mt-1 text-sm text-slate-600">
          Markiere einzelne Exemplare als <strong>buchbar</strong>,{" "}
          <strong>Sockel</strong> (bleibt im Raum) oder <strong>Puffer</strong>{" "}
          (nicht vorab buchbar). Nicht buchbare Exemplare werden in der
          Verfügbarkeit ausgegraut. In v1 ohne Login zugänglich.
        </p>
      </section>

      {error && <Notice type="error">{error}</Notice>}

      {loading ? (
        <p className="text-sm text-slate-500">Lädt …</p>
      ) : (
        categories.map((cat) => (
          <section key={cat.id} className="card p-5">
            <h2 className="mb-3 font-semibold">{cat.name}</h2>
            <ul className="divide-y divide-slate-100">
              {cat.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      <OwnerBadge owner={item.ownerDepartment} />
                    </div>
                    {item.note && (
                      <p className="text-xs text-slate-400">{item.note}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {(
                      [
                        { value: null, label: "Buchbar" },
                        { value: "SOCKEL" as const, label: "Sockel" },
                        { value: "PUFFER" as const, label: "Puffer" },
                      ] as { value: Reason | null; label: string }[]
                    ).map((opt) => {
                      const active = item.unavailableReason === opt.value;
                      return (
                        <button
                          key={opt.label}
                          disabled={savingId === item.id}
                          onClick={() => setReason(item, opt.value)}
                          className={[
                            "rounded-md border px-3 py-1.5 text-xs font-medium transition",
                            active
                              ? "border-brand bg-brand text-white"
                              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
