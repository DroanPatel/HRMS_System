import {
  BarChart3, Bell, Building2, CalendarDays, ClipboardCheck, FileText, LayoutDashboard,
  Settings, UserRound, Users, X, Clock3, BriefcaseBusiness
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut } from "lucide-react";

const items = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["all"] },
  { label: "Employees", to: "/employees", icon: Users, roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"] },
  { label: "Departments", to: "/departments", icon: Building2, roles: ["SUPER_ADMIN", "HR_ADMIN"] },
  { label: "Designations", to: "/designations", icon: BriefcaseBusiness, roles: ["SUPER_ADMIN", "HR_ADMIN"] },
  { label: "Attendance", to: "/attendance", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"] },
  { label: "My Attendance", to: "/my-attendance", icon: Clock3, roles: ["all"] },
  { label: "Leave Management", to: "/leave", icon: CalendarDays, roles: ["all"] },
  { label: "Leave Requests", to: "/leave/requests", icon: FileText, roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"] },
  { label: "My Profile", to: "/profile", icon: UserRound, roles: ["all"] },
  { label: "Notifications", to: "/notifications", icon: Bell, roles: ["all"] },
  { label: "Settings", to: "/settings", icon: Settings, roles: ["all"] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const { logout } = useAuth();

  const allowed = items.filter((item) => item.roles.includes("all") || item.roles.includes(user?.roleCode));

  return (
    <>
      {open && <button aria-label="Close sidebar" className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
          <div>
            <div className="text-xl font-bold text-blue-600">HRMS</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Human Resources</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {allowed.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        
        <button type="button" onClick={logout} className="sidebar-logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {user?.first_name?.[0] || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{user?.first_name} {user?.last_name}</p>
              <p className="truncate text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
