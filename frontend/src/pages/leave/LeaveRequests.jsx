import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Eye, X } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import SearchBar from "../../components/common/SearchBar";
import Select from "../../components/common/Select";
import ReasonModal from "../../components/common/ReasonModal";
import Toast from "../../components/common/Toast";
import leaveService from "../../services/leaveService";
import { getErrorMessage } from "../../utils/apiError";
import { formatDate } from "../../utils/dateTime";
import { LEAVE_STATUS, LEAVE_STATUS_OPTIONS } from "../../utils/labels";

const PAGE_SIZE = 15;

export default function LeaveRequests() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actingId, setActingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setLoadError("");
    const params = { page, page_size: PAGE_SIZE };
    if (status) params.status = status;
    if (debouncedSearch) params.search = debouncedSearch;
    try {
      const data = await leaveService.getLeavesPage(params);
      if (current !== requestId.current) return;
      if (data.results.length === 0 && page > 1) {
        setPage(page - 1);
        return;
      }
      setRows(data.results);
      setTotal(data.count);
    } catch (err) {
      if (current === requestId.current) setLoadError(getErrorMessage(err, "Unable to load leave requests."));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [status, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id, action, successMessage) => {
    setActingId(id);
    try {
      await action();
      setRejectTarget(null);
      setToast({ message: successMessage, type: "success" });
      await load();
    } catch (err) {
      setRejectTarget(null);
      setToast({ message: getErrorMessage(err, "Unable to update request."), type: "error" });
    } finally {
      setActingId(null);
    }
  };

  const columns = [
    { key: "employee", label: "Employee", render: (r) => <div><p className="font-medium text-slate-900 dark:text-white">{r.employee_name}</p><p className="text-xs text-slate-500">{r.employee_code}</p></div> },
    { key: "leave_type_name", label: "Type" },
    { key: "start_date", label: "From", render: (r) => formatDate(r.start_date) },
    { key: "end_date", label: "To", render: (r) => formatDate(r.end_date) },
    { key: "total_days", label: "Days" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={LEAVE_STATUS[r.status] || r.status} /> },
    { key: "actions", label: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <Link to={`/leave/${r.id}`} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600" aria-label="View"><Eye size={16} /></Link>
        {r.status === "PENDING" && (
          <>
            <Button size="sm" variant="success" loading={actingId === r.id} onClick={() => review(r.id, () => leaveService.approveLeave(r.id), "Leave approved.")}><Check size={14} /></Button>
            <Button size="sm" variant="danger" disabled={actingId === r.id} onClick={() => setRejectTarget(r)}><X size={14} /></Button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <>
      <PageHeader title="Leave Requests" description="Review and approve leave requests." />

      {loadError && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-5 dark:border-slate-800 md:grid-cols-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search employee..." />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={LEAVE_STATUS_OPTIONS} placeholder="All statuses" />
        </div>
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No leave requests found" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      <ReasonModal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title={`Reject ${rejectTarget?.employee_name || ""}'s request`}
        label="Reason for rejection"
        confirmLabel="Reject Request"
        loading={actingId === rejectTarget?.id}
        onSubmit={(comment) => review(rejectTarget.id, () => leaveService.rejectLeave(rejectTarget.id, comment), "Leave rejected.")}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
