"use client";

import type { Reason } from "@/lib/types";

export function ReasonBadge({ reason }: { reason: Reason | null }) {
  if (!reason) return null;
  const map: Record<Reason, { label: string; cls: string }> = {
    SOCKEL: {
      label: "Sockel (bleibt im Raum)",
      cls: "bg-amber-100 text-amber-800",
    },
    PUFFER: {
      label: "Puffer (nicht vorab buchbar)",
      cls: "bg-purple-100 text-purple-800",
    },
  };
  const { label, cls } = map[reason];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function OwnerBadge({ owner }: { owner: string | null }) {
  if (!owner) return null;
  return (
    <span className="badge bg-slate-100 text-slate-600">Eigentum: {owner}</span>
  );
}

export function KindBadge({ kind }: { kind: "PLACE" | "DEVICE" }) {
  return (
    <span
      className={`badge ${
        kind === "PLACE"
          ? "bg-sky-100 text-sky-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {kind === "PLACE" ? "Platz" : "Gerät"}
    </span>
  );
}

export function Notice({
  type,
  children,
}: {
  type: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const cls = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[type];
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${cls}`}>{children}</div>
  );
}
