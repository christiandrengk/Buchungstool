// Formatierungs- und kleine Client-Hilfsfunktionen.

const dateFmt = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return dateFmt.format(d);
}

export function formatTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return timeFmt.format(d);
}

/** Zeitraum kompakt: "Mo, 23.06., 09:00 – 11:00" bzw. mit Datum am Ende, falls anderer Tag. */
export function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${formatDateTime(start)} – ${formatTime(end)}`;
  }
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

/**
 * Wandelt einen <input type="datetime-local">-Wert (lokale Zeit ohne Zeitzone)
 * in einen ISO-String um, der die lokale Zeit als UTC-Instant beschreibt.
 */
export function localInputToISO(value: string): string {
  // value z. B. "2026-06-23T09:00" – als lokale Zeit interpretieren.
  const d = new Date(value);
  return d.toISOString();
}

/** Liefert einen datetime-local-Wert für "jetzt + offsetMinuten", auf 30 Min gerundet. */
export function defaultLocalInput(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  // auf nächste halbe Stunde runden
  d.setSeconds(0, 0);
  const minutes = d.getMinutes();
  const rounded = minutes < 30 ? 30 : 60;
  d.setMinutes(rounded === 60 ? 0 : 30);
  if (rounded === 60) d.setHours(d.getHours() + 1);
  // in lokales "YYYY-MM-DDTHH:mm" formatieren
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export async function fetchJSON<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as any)?.error ?? `Fehler ${res.status}`);
  }
  return json as T;
}
