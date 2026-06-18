"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/format";
import { Notice, OwnerBadge } from "@/components/common";
import type { Reason, DepartmentDTO } from "@/lib/types";

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

interface AddForm {
  label: string;
  ownerId: string;
}

export default function AdminPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  // Eingaben der "Hinzufügen"-Formulare je Kategorie.
  const [addForms, setAddForms] = useState<Record<number, AddForm>>({});
  const [addingCat, setAddingCat] = useState<number | null>(null);
  // Formular "Neue Kategorie".
  const [newCat, setNewCat] = useState({
    name: "",
    kind: "DEVICE" as "DEVICE" | "PLACE",
    description: "",
    ownerId: "",
    studentsAllowed: true,
    studentsInRoomOnly: false,
  });
  const [creatingCat, setCreatingCat] = useState(false);
  const [deletingCat, setDeletingCat] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, deps] = await Promise.all([
        fetchJSON<AdminCategory[]>("/api/admin/items"),
        fetchJSON<DepartmentDTO[]>("/api/departments"),
      ]);
      setCategories(cats);
      setDepartments(deps);
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
    setSuccess(null);
    try {
      await fetchJSON(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ unavailableReason: reason }),
      });
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

  const removeItem = async (cat: AdminCategory, item: AdminItem) => {
    if (!confirm(`„${item.label}" wirklich entfernen?`)) return;
    setSavingId(item.id);
    setError(null);
    setSuccess(null);
    try {
      await fetchJSON(`/api/admin/items/${item.id}`, { method: "DELETE" });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id
            ? { ...c, items: c.items.filter((i) => i.id !== item.id) }
            : c
        )
      );
      setSuccess(`„${item.label}" wurde entfernt.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const addItem = async (cat: AdminCategory) => {
    const form = addForms[cat.id] ?? { label: "", ownerId: "" };
    if (!form.label.trim()) {
      setError("Bitte eine Modell-/Gerätebezeichnung angeben.");
      return;
    }
    setAddingCat(cat.id);
    setError(null);
    setSuccess(null);
    try {
      const created = await fetchJSON<AdminItem>("/api/admin/items", {
        method: "POST",
        body: JSON.stringify({
          categoryId: cat.id,
          label: form.label.trim(),
          ownerDepartmentId: form.ownerId || null,
        }),
      });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id ? { ...c, items: [...c.items, created] } : c
        )
      );
      setAddForms((prev) => ({ ...prev, [cat.id]: { label: "", ownerId: "" } }));
      setSuccess(`„${created.label}" wurde hinzugefügt.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingCat(null);
    }
  };

  const createCategory = async () => {
    if (!newCat.name.trim()) {
      setError("Bitte einen Namen für die Kategorie angeben.");
      return;
    }
    setCreatingCat(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await fetchJSON<AdminCategory>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCat.name.trim(),
          kind: newCat.kind,
          description: newCat.description.trim() || null,
          ownerDepartmentId: newCat.ownerId || null,
          studentsAllowed: newCat.studentsAllowed,
          studentsInRoomOnly: newCat.studentsInRoomOnly,
        }),
      });
      setCategories((prev) => [...prev, created]);
      setNewCat({
        name: "",
        kind: "DEVICE",
        description: "",
        ownerId: "",
        studentsAllowed: true,
        studentsInRoomOnly: false,
      });
      setSuccess(`Kategorie „${created.name}" wurde angelegt.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreatingCat(false);
    }
  };

  const deleteCategory = async (cat: AdminCategory) => {
    if (!confirm(`Kategorie „${cat.name}" wirklich löschen?`)) return;
    setDeletingCat(cat.id);
    setError(null);
    setSuccess(null);
    try {
      await fetchJSON(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setSuccess(`Kategorie „${cat.name}" wurde gelöscht.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingCat(null);
    }
  };

  const updateForm = (catId: number, patch: Partial<AddForm>) =>
    setAddForms((prev) => {
      const base = prev[catId] ?? { label: "", ownerId: "" };
      return { ...prev, [catId]: { ...base, ...patch } };
    });

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-xl font-semibold">Verwaltung</h1>
        <p className="mt-1 text-sm text-slate-600">
          Exemplare als <strong>buchbar</strong>, <strong>Sockel</strong>{" "}
          (bleibt im Raum) oder <strong>Puffer</strong> (nicht vorab buchbar)
          markieren sowie Geräte <strong>hinzufügen</strong> oder{" "}
          <strong>entfernen</strong>. In v1 ohne Login zugänglich.
        </p>
      </section>

      {error && <Notice type="error">{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}

      {/* Neue Kategorie anlegen */}
      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Neue Kategorie anlegen</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cat-name">
              Name *
            </label>
            <input
              id="cat-name"
              className="input"
              placeholder="z. B. Beamer"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="cat-kind">
              Art
            </label>
            <select
              id="cat-kind"
              className="select"
              value={newCat.kind}
              onChange={(e) =>
                setNewCat({ ...newCat, kind: e.target.value as "DEVICE" | "PLACE" })
              }
            >
              <option value="DEVICE">Gerät (Ausleihe, Auto-Zuteilung)</option>
              <option value="PLACE">Platz (einzeln wählbar)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cat-owner">
              Standard-Eigentümer (optional)
            </label>
            <select
              id="cat-owner"
              className="select"
              value={newCat.ownerId}
              onChange={(e) => setNewCat({ ...newCat, ownerId: e.target.value })}
            >
              <option value="">— keine —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cat-desc">
              Beschreibung (optional)
            </label>
            <input
              id="cat-desc"
              className="input"
              value={newCat.description}
              onChange={(e) =>
                setNewCat({ ...newCat, description: e.target.value })
              }
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={newCat.studentsAllowed}
            onChange={(e) =>
              setNewCat({ ...newCat, studentsAllowed: e.target.checked })
            }
          />
          Für Studierende erlaubt
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={newCat.studentsInRoomOnly}
            onChange={(e) =>
              setNewCat({ ...newCat, studentsInRoomOnly: e.target.checked })
            }
          />
          Studierende nur „Nutzung im Raum" (keine Ausleihe) – z. B. Owl,
          3D-Brille
        </label>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn-primary"
            disabled={creatingCat}
            onClick={createCategory}
          >
            {creatingCat ? "Lege an …" : "Kategorie anlegen"}
          </button>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Lädt …</p>
      ) : (
        categories.map((cat) => {
          const form = addForms[cat.id] ?? { label: "", ownerId: "" };
          return (
            <section key={cat.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold">
                  {cat.name}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    ({cat.items.length} Stück)
                  </span>
                </h2>
                <button
                  type="button"
                  disabled={deletingCat === cat.id || cat.items.length > 0}
                  onClick={() => deleteCategory(cat)}
                  title={
                    cat.items.length > 0
                      ? "Erst alle Exemplare entfernen, dann ist die Kategorie löschbar."
                      : "Kategorie löschen"
                  }
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Kategorie löschen
                </button>
              </div>
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
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
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
                      <button
                        disabled={savingId === item.id}
                        onClick={() => removeItem(cat, item)}
                        className="ml-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        title="Exemplar entfernen"
                      >
                        Entfernen
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Hinzufügen */}
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="label" htmlFor={`label-${cat.id}`}>
                    Neues Gerät / Modell
                  </label>
                  <input
                    id={`label-${cat.id}`}
                    className="input"
                    placeholder="z. B. Panasonic HC-V777 #5"
                    value={form.label}
                    onChange={(e) =>
                      updateForm(cat.id, { label: e.target.value })
                    }
                  />
                </div>
                <div className="sm:w-64">
                  <label className="label" htmlFor={`owner-${cat.id}`}>
                    Eigentümer-Abteilung (optional)
                  </label>
                  <select
                    id={`owner-${cat.id}`}
                    className="select"
                    value={form.ownerId}
                    onChange={(e) =>
                      updateForm(cat.id, { ownerId: e.target.value })
                    }
                  >
                    <option value="">— keine —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={addingCat === cat.id}
                  onClick={() => addItem(cat)}
                >
                  {addingCat === cat.id ? "Füge hinzu …" : "Hinzufügen"}
                </button>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
