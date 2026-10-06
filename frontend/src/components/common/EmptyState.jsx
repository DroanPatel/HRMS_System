import { Inbox } from "lucide-react";

export default function EmptyState({ title = "No data found", description = "There is nothing to display." }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800">
        <Inbox size={24} />
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
