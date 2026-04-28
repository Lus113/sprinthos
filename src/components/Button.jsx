import { LoaderCircle } from "lucide-react";

export default function Button({
  children,
  className = "",
  loading = false,
  variant = "primary",
  type = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70";
  const variants = {
    primary: "accent-button text-white shadow-lg shadow-lime-500/20 hover:-translate-y-0.5",
    outline:
      "outline-button border border-stone-900/10 bg-white/80 text-stone-900 hover:-translate-y-0.5",
    ghost:
      "bg-transparent text-stone-900 hover:bg-white/70"
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Загрузка...
        </>
      ) : (
        children
      )}
    </button>
  );
}
