"use client";

import { useEffect, useRef, useState } from "react";

// Öffnungszeiten (für "ganztägig" ohne konkrete Uhrzeit).
const OPEN = "07:00";
const CLOSE = "21:00";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export interface DateRangeValue {
  start: string; // datetime-local "YYYY-MM-DDTHH:mm"
  end: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const minStr = (a: string, b: string) => (a <= b ? a : b);
const maxStr = (a: string, b: string) => (a >= b ? a : b);

function parseInitial(value?: DateRangeValue) {
  const today = isoDate(new Date());
  if (value?.start && value?.end) {
    const s = value.start.split("T")[0];
    const e = value.end.split("T")[0];
    if (s && e) return { start: s, end: e };
  }
  return { start: today, end: today };
}

function formatDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00`);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value?: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
}) {
  const initial = useRef(parseInitial(value)).current;
  const today = isoDate(new Date());

  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [withTimes, setWithTimes] = useState(false);
  const [startTime, setStartTime] = useState(OPEN);
  const [endTime, setEndTime] = useState(CLOSE);

  // angezeigter Monat
  const startDate = new Date(`${initial.start}T00:00`);
  const [view, setView] = useState({
    y: startDate.getFullYear(),
    m: startDate.getMonth(),
  });

  // Auswahl-Interaktion
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"idle" | "await-second">("idle");
  const anchorRef = useRef<string | null>(null);
  const draggingRef = useRef(false);
  const startRef = useRef(start);
  const endRef = useRef(end);
  startRef.current = start;
  endRef.current = end;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Auswahl nach außen melden.
  useEffect(() => {
    const sTime = withTimes ? startTime : OPEN;
    const eTime = withTimes ? endTime : CLOSE;
    onChangeRef.current({
      start: `${start}T${sTime}`,
      end: `${end}T${eTime}`,
    });
  }, [start, end, withTimes, startTime, endTime]);

  // Ziehen beenden, auch außerhalb des Kalenders.
  useEffect(() => {
    const up = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
      setPhase(startRef.current === endRef.current ? "await-second" : "idle");
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const selectDay = (dateStr: string) => {
    if (dateStr < today) return; // Vergangenheit nicht buchbar
    if (phase === "await-second" && anchorRef.current) {
      setStart(minStr(anchorRef.current, dateStr));
      setEnd(maxStr(anchorRef.current, dateStr));
      setPhase("idle");
      return;
    }
    anchorRef.current = dateStr;
    setStart(dateStr);
    setEnd(dateStr);
    draggingRef.current = true;
    setDragging(true);
  };

  const enterDay = (dateStr: string) => {
    if (draggingRef.current && anchorRef.current && dateStr >= today) {
      setStart(minStr(anchorRef.current, dateStr));
      setEnd(maxStr(anchorRef.current, dateStr));
    }
  };

  // Monatsraster aufbauen (Wochen Mo–So)
  const firstOfMonth = new Date(view.y, view.m, 1);
  const leading = (firstOfMonth.getDay() + 6) % 7; // Mo = 0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${view.y}-${pad(view.m + 1)}-${pad(d)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const changeMonth = (delta: number) => {
    const m = view.m + delta;
    const d = new Date(view.y, m, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const sameDay = start === end;
  const invalidTimes =
    withTimes && sameDay && timeToMin(endTime) <= timeToMin(startTime);

  const dayCount =
    (new Date(`${end}T00:00`).getTime() - new Date(`${start}T00:00`).getTime()) /
      86_400_000 +
    1;

  return (
    <div className="space-y-3">
      {/* Monatsnavigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="btn-secondary px-2 py-1"
          onClick={() => changeMonth(-1)}
          aria-label="Vorheriger Monat"
        >
          ‹
        </button>
        <span className="font-medium">
          {MONTHS[view.m]} {view.y}
        </span>
        <button
          type="button"
          className="btn-secondary px-2 py-1"
          onClick={() => changeMonth(1)}
          aria-label="Nächster Monat"
        >
          ›
        </button>
      </div>

      {/* Kalenderraster */}
      <div className="select-none touch-none">
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((dateStr, idx) => {
            if (!dateStr) return <div key={idx} />;
            const day = Number(dateStr.split("-")[2]);
            const past = dateStr < today;
            const selected = dateStr >= start && dateStr <= end;
            const isStart = dateStr === start;
            const isEnd = dateStr === end;
            const isToday = dateStr === today;
            return (
              <button
                type="button"
                key={dateStr}
                disabled={past}
                onPointerDown={(e) => {
                  e.preventDefault();
                  selectDay(dateStr);
                }}
                onPointerEnter={() => enterDay(dateStr)}
                className={[
                  "h-10 rounded text-sm transition",
                  past
                    ? "cursor-not-allowed text-slate-300"
                    : selected
                      ? "bg-brand text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  (isStart || isEnd) && !past ? "font-semibold" : "",
                  isToday && !selected ? "ring-1 ring-brand/40" : "",
                ].join(" ")}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Einzelnen Tag anklicken oder über mehrere Tage ziehen. Für einen Zeitraum
        über Monatsgrenzen: Starttag klicken, Monat wechseln, Endtag klicken.
      </p>

      {/* Uhrzeit-Option */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={withTimes}
          onChange={(e) => setWithTimes(e.target.checked)}
        />
        Uhrzeiten angeben (sonst ganztägig {OPEN}–{CLOSE} Uhr)
      </label>

      {withTimes && (
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="label" htmlFor="startTime">
              Startzeit{!sameDay && " (erster Tag)"}
            </label>
            <input
              id="startTime"
              type="time"
              step={1800}
              min={OPEN}
              max={CLOSE}
              className="input w-32"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="endTime">
              Endzeit{!sameDay && " (letzter Tag)"}
            </label>
            <input
              id="endTime"
              type="time"
              step={1800}
              min={OPEN}
              max={CLOSE}
              className="input w-32"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Zusammenfassung */}
      {invalidTimes ? (
        <p className="text-sm text-red-600">
          Die Endzeit muss nach der Startzeit liegen.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-md bg-brand/10 px-3 py-1.5 font-medium text-brand-dark">
            {sameDay
              ? formatDay(start)
              : `${formatDay(start)} – ${formatDay(end)}`}
          </span>
          <span className="text-slate-500">
            {sameDay ? "1 Tag" : `${dayCount} Tage`} ·{" "}
            {withTimes ? `${startTime}–${endTime} Uhr` : `ganztägig (${OPEN}–${CLOSE})`}
          </span>
        </div>
      )}
    </div>
  );
}
