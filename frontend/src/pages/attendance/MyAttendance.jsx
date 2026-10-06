import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, LogIn, LogOut } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Toast from "../../components/common/Toast";
import attendanceService from "../../services/attendanceService";
import { getErrorMessage } from "../../utils/apiError";
import { formatDate, formatDuration, formatTime, monthKey } from "../../utils/dateTime";
import { ATTENDANCE_STATUS } from "../../utils/labels";

export default function MyAttendance() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const [todayData, rows] = await Promise.all([
        attendanceService.getToday(),
        attendanceService.getMyAttendance({ month: monthKey(new Date()) }),
      ]);
      setToday(todayData.attendance);
      setHistory(rows);
    } catch (err) {
      setLoadError(getErrorMessage(err, "Unable to load attendance."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action, successMessage) => {
    setActing(true);
    try {
      await action();
      setToast({ message: successMessage, type: "success" });
      await load(true);
    } catch (err) {
      setToast({ message: getErrorMessage(err, "Action failed."), type: "error" });
    } finally {
      setActing(false);
    }
  };

  const checkedIn = Boolean(today?.check_in);
  const checkedOut = Boolean(today?.check_out);
  const workedSeconds = checkedIn
    ? checkedOut ? today.worked_seconds : Math.max(0, Math.floor((now - new Date(today.check_in)) / 1000))
    : null;
  const statusText = !checkedIn ? "Not Checked In" : checkedOut ? "Checked Out" : "Checked In";

  const columns = [
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
    { key: "check_in", label: "Check In", render: (r) => formatTime(r.check_in) },
    { key: "check_out", label: "Check Out", render: (r) => formatTime(r.check_out) },
    { key: "hours", label: "Hours", render: (r) => (r.check_in && !r.check_out ? "In progress" : formatDuration(r.worked_seconds)) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={ATTENDANCE_STATUS[r.status] || r.status} /> },
  ];

  return (
    <>
      <PageHeader title="My Attendance" description="Track your daily attendance and working hours." />

      {loadError && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={() => load()}>Retry</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Today's Status" value={statusText} icon={CheckCircle2} iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Check In" value={formatTime(today?.check_in)} icon={LogIn} />
        <StatCard title="Working Hours" value={formatDuration(workedSeconds)} icon={Clock3} />
      </div>

      <Card className="mt-6" title="Today's Attendance">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="text-4xl font-bold text-slate-900 dark:text-white">{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
          <p className="mt-2 text-sm text-slate-500">{now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <div className="mt-6">
            {!checkedIn && <Button loading={acting} disabled={loading || Boolean(loadError)} onClick={() => act(attendanceService.checkIn, "Checked in.")}><LogIn size={17} /> Check In</Button>}
            {checkedIn && !checkedOut && <Button variant="danger" loading={acting} onClick={() => act(attendanceService.checkOut, "Checked out.")}><LogOut size={17} /> Check Out</Button>}
            {checkedOut && <p className="text-sm font-medium text-emerald-600">You're done for today.</p>}
          </div>
        </div>
      </Card>

      <Card className="mt-6" title="This Month">
        <DataTable columns={columns} data={history} loading={loading} emptyTitle="No attendance records this month" />
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
