import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, CheckCircle2, Clock3, UserCheck, UserMinus, UserRoundPlus, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../components/common/Card";
import StatCard from "../components/common/StatCard";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import dashboardService from "../services/dashboardService";
import { getErrorMessage } from "../utils/apiError";
import { formatDate, formatTime } from "../utils/dateTime";
import { isHR } from "../utils/roles";

const PIE_COLORS = ["#2563eb", "#f59e0b", "#10b981", "#94a3b8", "#8b5cf6", "#ef4444"];
const STATE_TEXT = { NOT_CHECKED_IN: "Not checked in", CHECKED_IN: "Checked in", CHECKED_OUT: "Checked out" };

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="rounded-lg border border-slate-200 p-4 text-center text-sm hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
      <Icon className="mx-auto mb-2 text-blue-600" size={21} /> {label}
    </Link>
  );
}

const NoData = ({ text }) => <p className="flex h-full items-center justify-center text-sm text-slate-400">{text}</p>;

function TeamDashboard({ data, hr }) {
  const { cards } = data;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={hr ? "Total Employees" : "Team Members"} value={cards.total_employees} subtitle={`${cards.departments} department(s) • ${cards.new_joiners_this_month} joined this month`} icon={Users} />
        <StatCard title="Present Today" value={cards.present_today} subtitle={cards.total_employees ? `${Math.round((cards.present_today / cards.total_employees) * 100)}% of ${hr ? "workforce" : "team"}` : "—"} icon={UserCheck} iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="On Leave" value={cards.on_leave_today} subtitle={`${cards.pending_requests} request(s) awaiting approval`} icon={CalendarDays} iconClass="bg-amber-50 text-amber-600" />
        <StatCard title="Absent Today" value={cards.absent_today} subtitle={`${cards.not_marked_today} not marked yet`} icon={UserMinus} iconClass="bg-red-50 text-red-600" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title={hr ? "Employees by Department" : "Team by Department"} className="xl:col-span-2">
          <div className="h-72 p-4">
            {data.department_headcount.length === 0 ? <NoData text="No employees yet." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.department_headcount}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="employees" fill="#2563eb" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Leave This Year">
          <div className="h-72 p-4">
            {data.leave_distribution.length === 0 ? <NoData text="No leave requests yet." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.leave_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                    {data.leave_distribution.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Attendance: Last 7 Days">
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendance_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" name="Present" dataKey="present" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" name="Absent" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" name="On leave" dataKey="leave" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Pending Leave Requests" action={<Link className="text-sm font-medium text-blue-600" to="/leave/requests">View all</Link>}>
          {data.pending_requests.length === 0 ? <p className="p-6 text-sm text-slate-400">Nothing waiting for approval.</p> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.pending_requests.map((leave) => (
                <Link key={leave.id} to={`/leave/${leave.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{leave.employee_name}</p>
                    <p className="text-xs text-slate-500">{leave.leave_type_name} • {leave.total_days} day(s) from {formatDate(leave.start_date)}</p>
                  </div>
                  <span className="text-xs font-medium text-amber-600">Review</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {hr && <QuickLink to="/employees/new" icon={UserRoundPlus} label="Add Employee" />}
            <QuickLink to="/leave/apply" icon={CalendarDays} label="Apply Leave" />
            <QuickLink to="/attendance" icon={Clock3} label="Attendance" />
            <QuickLink to="/employees" icon={Users} label="Employees" />
          </div>
        </Card>

        <Card title="Upcoming Birthdays (30 days)">
          {data.upcoming_birthdays.length === 0 ? <p className="p-6 text-sm text-slate-400">No birthdays coming up.</p> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.upcoming_birthdays.map((b) => (
                <div key={`${b.name}-${b.date}`} className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm font-medium dark:text-white">{b.name}</span>
                  <span className="text-xs text-slate-500">{b.days_until === 0 ? "Today" : b.days_until === 1 ? "Tomorrow" : formatDate(b.date)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function EmployeeDashboard({ data }) {
  const { cards } = data;
  if (!data.linked) {
    return (
      <Card>
        <p className="p-6 text-sm text-slate-600 dark:text-slate-300">
          Your login isn't linked to an employee record yet, so attendance and leave aren't available. Ask HR to link it.
        </p>
      </Card>
    );
  }
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today" value={STATE_TEXT[cards.attendance_state]} subtitle={cards.check_in ? `In at ${formatTime(cards.check_in)}${cards.check_out ? ` • out at ${formatTime(cards.check_out)}` : ""}` : "Go to My Attendance to check in"} icon={CheckCircle2} iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Days Present" value={cards.days_present_this_month} subtitle="This month" icon={UserCheck} />
        <StatCard title="Pending Requests" value={cards.pending_requests} subtitle="Leave awaiting approval" icon={CalendarDays} iconClass="bg-amber-50 text-amber-600" />
        <StatCard title="Notifications" value={cards.unread_notifications} subtitle="Unread" icon={Bell} iconClass="bg-blue-50 text-blue-600" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Leave Balances (this year)">
          {data.leave_balances.length === 0 ? <p className="p-6 text-sm text-slate-400">No leave types set up yet.</p> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.leave_balances.map((b) => (
                <div key={b.leave_type_name} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{b.leave_type_name}</p>
                    <p className="text-xs text-slate-500">{b.used} used • {b.pending} pending</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{b.remaining === null ? "Unlimited" : `${b.remaining} days left`}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Next Approved Leave">
            <p className="p-5 text-sm text-slate-600 dark:text-slate-300">
              {data.next_leave ? `${data.next_leave.leave_type_name}: ${formatDate(data.next_leave.start_date)} to ${formatDate(data.next_leave.end_date)}` : "No upcoming approved leave."}
            </p>
          </Card>
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-3 p-5">
              <QuickLink to="/my-attendance" icon={Clock3} label="My Attendance" />
              <QuickLink to="/leave/apply" icon={CalendarDays} label="Apply Leave" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await dashboardService.getDashboard());
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load the dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const description = data?.view === "employee" ? "Your attendance, leave and notifications." : data?.view === "manager" ? "An overview of your team today." : "Overview of your HR operations for today.";

  return (
    <>
      <PageHeader title="Dashboard" description={description} />
      {loading && <div className="flex justify-center p-16"><LoadingSpinner size="lg" /></div>}
      {error && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}
      {!loading && data && (data.view === "employee" ? <EmployeeDashboard data={data} /> : <TeamDashboard data={data} hr={isHR(user)} />)}
    </>
  );
}
