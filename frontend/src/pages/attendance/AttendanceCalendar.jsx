import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import attendanceService from "../../services/attendanceService";
import { getErrorMessage } from "../../utils/apiError";
import { formatTime, monthKey, toISODate } from "../../utils/dateTime";
import { ATTENDANCE_STATUS } from "../../utils/labels";

export default function AttendanceCalendar() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await attendanceService.getMyAttendance({ month: monthKey(month) });
        if (!cancelled) setRecords(Object.fromEntries(rows.map((r) => [r.date, r])));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Unable to load attendance."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [month]);

  const shift = (delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading = month.getDay();
  const todayKey = toISODate(new Date());

  return (
    <>
      <PageHeader
        title="Attendance Calendar"
        description="Your monthly attendance overview."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={17} /></Button>
            <span className="min-w-36 text-center text-sm font-semibold text-slate-800 dark:text-white">
              {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
            <Button variant="secondary" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={17} /></Button>
          </div>
        }
      />

      {error && <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        {loading ? (
          <div className="flex justify-center p-16"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-semibold text-slate-500 dark:border-slate-800">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="p-3">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: leading }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-24 border-b border-r border-slate-100 dark:border-slate-800" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const key = toISODate(new Date(month.getFullYear(), month.getMonth(), day));
                const record = records[key];
                return (
                  <div key={day} className={`min-h-24 border-b border-r border-slate-100 p-2 dark:border-slate-800 ${key === todayKey ? "bg-blue-50/60 dark:bg-blue-950/20" : ""}`}>
                    <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{day}</div>
                    {record && (
                      <>
                        <StatusBadge status={ATTENDANCE_STATUS[record.status] || record.status} />
                        {record.check_in && <p className="mt-1 text-[11px] text-slate-500">{formatTime(record.check_in)}{record.check_out ? ` – ${formatTime(record.check_out)}` : ""}</p>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </>
  );
}
