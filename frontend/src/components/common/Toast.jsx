export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-5 right-5 z-[60] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${type === "error" ? "bg-red-600" : "bg-slate-900"}`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="text-white/70 hover:text-white">×</button>
      </div>
    </div>
  );
}
