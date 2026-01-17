export default function Input({
  label,
  helper,
  as = "input",
  className = "",
  ...props
}) {
  const Component = as === "textarea" ? "textarea" : "input";
  return (
    <label className="block text-sm text-gray-700">
      <span className="font-medium text-gray-800">{label}</span>
      <Component
        className={`mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${className}`}
        {...props}
      />
      {helper && <span className="mt-1 block text-xs text-gray-500">{helper}</span>}
    </label>
  );
}
