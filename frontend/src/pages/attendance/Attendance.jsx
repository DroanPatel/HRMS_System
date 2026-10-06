import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Clock3, UserCheck, UserMinus } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import SearchBar from "../../components/common/SearchBar";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import StatusBadge from "../../components/common/StatusBadge";
import attendanceService from "../../services/attendanceService";
import { getErrorMessage } from "../../utils/apiError";
import { formatDuration, formatTime, toISODate } from "../../utils/dateTime";
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_OPTIONS } from "../../utils/labels";

const PAGE_SIZE = 20;

export default function Attendance() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setLoadError("");
    const params = { date, page, page_size: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (status) params.status = status;
    try {
      const [list, stats] = await Promise.all([
        attendanceService.getAttendancePage(params),
        attendanceService.getSummary({ date }),
      ]);
      if (current !== requestId.current) return;
      if (list.results.length === 0 && page > 1) {
        setPage(page - 1);
        return;
      }
      setRows(list.results);
      setTotal(list.count);
      setSummary(stats);
    } catch (err) {
      if (current === requestId.current) setLoadError(getErrorMessage(err, "Unable to load attendance."));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [date, debouncedSearch, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { key: "employee", label: "Employee", render: (r) => <div><p className="font-medium text-slate-900 dark:text-white">{r.employee_name}</p><p className="text-xs text-slate-500">{r.employee_code}</p></div> },
    { key: "department_name", label: "Department" },
    { key: "check_in", label: "Check In", render: (r) => formatTime(r.check_in) },
    { key: "check_out", label: "Check Out", render: (r) => formatTime(r.check_out) },
    { key: "hours", label: "Hours", render: (r) => (r.check_in && !r.check_out ? "In progress" : formatDuration(r.worked_seconds)) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={ATTENDANCE_STATUS[r.status] || r.status} /> },
  ];

  const n = (key) => (summary ? summary[key] : "—");

  return (
    <>
      <PageHeader title="Attendance" description="Monitor daily employee attendance." />

      {loadError && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Present" value={n("present")} icon={UserCheck} iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="On Leave" value={n("on_leave")} icon={CalendarDays} iconClass="bg-blue-50 text-blue-600" />
        <StatCard title="Absent" value={n("absent")} icon={UserMinus} iconClass="bg-red-50 text-red-600" />
        <StatCard title="Not Marked" value={n("not_marked")} subtitle={summary ? `of ${summary.total} active employees` : undefined} icon={Clock3} iconClass="bg-amber-50 text-amber-600" />
      </div>

      <Card className="mt-6">
        <div className="grid gap-3 border-b border-slate-100 p-5 dark:border-slate-800 md:grid-cols-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search employee..." />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={ATTENDANCE_STATUS_OPTIONS} placeholder="All statuses" />
          <Input type="date" value={date} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setPage(1); } }} />
        </div>
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No attendance records for this date" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>
    </>
  );
}
