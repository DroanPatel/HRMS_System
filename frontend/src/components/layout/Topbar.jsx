import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useTheme } from "../../context/ThemeContext";

export default function Topbar({ onMenu }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800">
          <Menu size={21} />
        </button>
        <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 md:flex dark:bg-slate-800">
          <Search size={16} className="text-slate-400" />
          <input placeholder="Search HRMS..." className="w-48 bg-transparent text-sm outline-none dark:text-white" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <Link to="/notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>
        <Link to="/profile" className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {user?.first_name?.[0] || "U"}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-white">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-slate-500">{user?.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
