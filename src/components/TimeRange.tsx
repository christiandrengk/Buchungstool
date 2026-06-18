"use client";

export interface TimeRangeValue {
  start: string; // datetime-local
  end: string; // datetime-local
}

export function TimeRange({
  value,
  onChange,
}: {
  value: TimeRangeValue;
  onChange: (v: TimeRangeValue) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="start">
          Von *
        </label>
        <input
          id="start"
          type="datetime-local"
          className="input"
          required
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
        />
      </div>
      <div>
        <label className="label" htmlFor="end">
          Bis *
        </label>
        <input
          id="end"
          type="datetime-local"
          className="input"
          required
          value={value.end}
          min={value.start}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
        />
      </div>
    </div>
  );
}
