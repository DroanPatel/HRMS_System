export default function StatCard({ title, value, subtitle, icon: Icon, trend, iconClass = "bg-blue-50 text-blue-600" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`rounded-lg p-3 ${iconClass}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trend && <p className="mt-4 text-xs font-medium text-emerald-600">{trend}</p>}
    </div>
  );
}
