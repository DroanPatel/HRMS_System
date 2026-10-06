import { ChevronLeft, ChevronRight } from "lucide-react";

const btn = "rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700";

export default function Pagination({ page, pageSize, total, onChange }) {
  if (!total) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const first = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => first + i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 dark:border-slate-800 sm:flex-row">
      <span>Showing {from}–{to} of {total}</span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button className={`${btn} hover:bg-slate-50 dark:hover:bg-slate-800`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
          {pages.map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={`${btn} ${n === page ? "border-blue-600 bg-blue-600 text-white" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              {n}
            </button>
          ))}
          <button className={`${btn} hover:bg-slate-50 dark:hover:bg-slate-800`} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
