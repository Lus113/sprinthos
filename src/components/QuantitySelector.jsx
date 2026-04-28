import { Minus, Plus } from "lucide-react";

export default function QuantitySelector({ value, onChange, max = 99 }) {
  return (
    <div className="inline-flex items-center rounded-full border border-stone-900/10 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="rounded-full p-2 text-stone-700 transition hover:bg-lime-50"
        aria-label="Уменьшить количество"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-10 text-center text-sm font-semibold text-stone-900">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="rounded-full p-2 text-stone-700 transition hover:bg-lime-50"
        aria-label="Увеличить количество"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
