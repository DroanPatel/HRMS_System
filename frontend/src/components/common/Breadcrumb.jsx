import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500">
      {items.map((item, index) => (
        <span className="flex items-center gap-1" key={`${item.label}-${index}`}>
          {index > 0 && <ChevronRight size={13} />}
          {item.to ? <Link className="hover:text-blue-600" to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
