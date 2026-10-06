export default function LoadingSpinner({ size = "md" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 ${sizes[size] || sizes.md}`}
      aria-label="Loading"
    />
  );
}
