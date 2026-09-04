"use client";

import { type ChangeEvent } from "react";

type ServingsControlProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function ServingsControl({ value, onChange, min = 1, max = 24 }: ServingsControlProps) {
  function decrement() {
    onChange(Math.max(min, value - 1));
  }

  function increment() {
    onChange(Math.min(max, value + 1));
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const parsed = Number.parseInt(event.target.value, 10);
    if (Number.isFinite(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  }

  return (
    <div className="grid gap-1">
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">Servings</span>
      <div className="inline-flex items-center rounded-xl border border-line bg-white">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="flex size-12 items-center justify-center text-xl text-ink disabled:opacity-40"
          aria-label="Decrease servings"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          className="w-12 border-x border-line bg-transparent py-2 text-center text-lg font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label="Servings"
        />
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="flex size-12 items-center justify-center text-xl text-ink disabled:opacity-40"
          aria-label="Increase servings"
        >
          +
        </button>
      </div>
    </div>
  );
}
