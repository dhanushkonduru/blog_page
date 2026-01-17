const variants = {
  primary:
    "border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200",
  secondary:
    "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900 focus:ring-gray-200",
  ghost: "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
};

const sizes = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm"
};

export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl border font-medium transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
