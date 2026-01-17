const toneMap = {
  Design: "bg-blue-50 text-blue-700 ring-blue-100",
  Product: "bg-purple-50 text-purple-700 ring-purple-100",
  Engineering: "bg-orange-50 text-orange-700 ring-orange-100",
  Business: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Marketing: "bg-amber-50 text-amber-700 ring-amber-100",
  Research: "bg-slate-100 text-slate-700 ring-slate-200"
};

export default function Tag({ label }) {
  const tone = toneMap[label] || "bg-blue-50 text-blue-700 ring-blue-100";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {label}
    </span>
  );
}
