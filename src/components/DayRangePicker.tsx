"use client";

import { useEffect, useRef, useState } from "react";

// Öffnungszeiten-Raster (anpassbar): 07:00–21:00 in 30-Minuten-Schritten.
const OPEN_MIN = 7 * 60;
const CLOSE_MIN = 21 * 60;
const STEP = 30;
const SLOT_COUNT = (CLOSE_MIN - OPEN_MIN) / STEP;

export interface DayRangeValue {
  start: string; // datetime-local "YYYY-MM-DDTHH:mm" (oder "")
  end: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const minToHHMM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const hhmmToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Bestehenden Wert (falls vorhanden) in Datum + Slot-Indizes übersetzen.
function parseValue(v?: DayRangeValue) {
  if (v?.start && v?.end) {
    const [d, t1] = v.start.split("T");
    const t2 = v.end.split("T")[1];
    if (d && t1 && t2) {
      const m1 = hhmmToMin(t1);
      const m2 = hhmmToMin(t2);
      if (m1 >= OPEN_MIN && m2 <= CLOSE_MIN && m2 > m1) {
        return {
          date: d,
          selStart: (m1 - OPEN_MIN) / STEP,
          selEnd: (m2 - OPEN_MIN) / STEP - 1,
        };
      }
    }
  }
  // Standard: heute, 09:00–10:00
  return {
    date: todayISODate(),
    selStart: (9 * 60 - OPEN_MIN) / STEP,
    selEnd: (9 * 60 - OPEN_MIN) / STEP + 1,
  };
}

export function DayRangePicker({
  value,
  onChange,
}: {
  value?: DayRangeValue;
  onChange: (v: DayRangeValue) => void;
}) {
  const init = useRef(parseValue(value)).current;
  const [date, setDate] = useState(init.date);
  const [selStart, setSelStart] = useState<number | null>(init.selStart);
  const [selEnd, setSelEnd] = useState<number | null>(init.selEnd);
  const [dragging, setDragging] = useState(false);
  const [anchor, setAnchor] = useState<number | null>(null);

  // onChange in Ref halten, damit der Emit-Effekt nicht bei jedem Render feuert.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Auswahl nach außen melden (datetime-local Strings).
  useEffect(() => {
    if (selStart === null || selEnd === null) {
      onChangeRef.current({ start: "", end: "" });
      return;
    }
    const s = OPEN_MIN + selStart * STEP;
    const e = OPEN_MIN + (selEnd + 1) * STEP;
    onChangeRef.current({
      start: `${date}T${minToHHMM(s)}`,
      end: `${date}T${minToHHMM(e)}`,
    });
  }, [date, selStart, selEnd]);

  // Ziehen endet auch, wenn die Maus außerhalb des Rasters losgelassen wird.
  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const onDown = (i: number) => {
    setAnchor(i);
    setSelStart(i);
    setSelEnd(i);
    setDragging(true);
  };
  const onEnter = (i: number) => {
    if (dragging && anchor !== null) {
      setSelStart(Math.min(anchor, i));
      setSelEnd(Math.max(anchor, i));
    }
  };

  const hasSel = selStart !== null && selEnd !== null;
  const startMin = hasSel ? OPEN_MIN + selStart! * STEP : 0;
  const endMin = hasSel ? OPEN_MIN + (selEnd! + 1) * STEP : 0;
  const durationMin = endMin - startMin;
  const durationLabel =
    durationMin % 60 === 0
      ? `${durationMin / 60} Std.`
      : `${Math.floor(durationMin / 60)} Std. ${durationMin % 60} Min.`;

  const weekday = (() => {
    const d = new Date(`${date}T00:00`);
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(d);
  })();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="label" htmlFor="day">
            Tag
          </label>
          <input
            id="day"
            type="date"
            className="input"
            value={date}
            min={todayISODate()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <p className="pb-2 text-xs text-slate-400">
          Im Raster den Zeitraum mit der Maus aufziehen (klicken &amp; ziehen)
          oder einzelne Felder antippen.
        </p>
      </div>

      <div className="select-none touch-none rounded-md border border-slate-200 p-2">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-7">
          {Array.from({ length: SLOT_COUNT }).map((_, i) => {
            const min = OPEN_MIN + i * STEP;
            const selected = hasSel && i >= selStart! && i <= selEnd!;
            return (
              <button
                type="button"
                key={i}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onDown(i);
                }}
                onPointerEnter={() => onEnter(i)}
                className={[
                  "rounded px-1 py-1.5 text-center text-xs font-medium transition",
                  selected
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                {minToHHMM(min)}
              </button>
            );
          })}
        </div>
      </div>

      {hasSel ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-md bg-brand/10 px-3 py-1.5 font-medium text-brand-dark">
            {weekday} · {minToHHMM(startMin)}–{minToHHMM(endMin)}
          </span>
          <span className="text-slate-500">Dauer: {durationLabel}</span>
          <button
            type="button"
            className="text-xs text-slate-400 underline hover:text-slate-600"
            onClick={() => {
              setSelStart(null);
              setSelEnd(null);
            }}
          >
            Auswahl löschen
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Noch kein Zeitraum gewählt – bitte im Raster auswählen.
        </p>
      )}
    </div>
  );
}
