import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Eye, X } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Toast from "../../components/common/Toast";
import leaveService from "../../services/leaveService";
import { getErrorMessage } from "../../utils/apiError";
import { formatDate } from "../../utils/dateTime";
import { LEAVE_STATUS } from "../../utils/labels";

export default function Leave() {
  const [balances, setBalances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [balanceData, leaveData] = await Promise.all([leaveService.getBalance(), leaveService.getMyLeaves()]);
      setBalances(balanceData);
      setLeaves(leaveData);
    } catch (err) {
      setLoadError(getErrorMessage(err, "Unable to load leave data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await leaveService.cancelLeave(cancelTarget.id);
      setCancelTarget(null);
      setToast({ message: "Leave request cancelled.", type: "success" });
      await load();
    } catch (err) {
      setCancelTarget(null);
      setToast({ message: getErrorMessage(err, "Unable to cancel request."), type: "error" });
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    { key: "leave_type_name", label: "Leave Type" },
    { key: "start_date", label: "From", render: (r) => formatDate(r.start_date) },
    { key: "end_date", label: "To", render: (r) => formatDate(r.end_date) },
    { key: "total_days", label: "Days" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={LEAVE_STATUS[r.status] || r.status} /> },
    { key: "reason", label: "Reason" },
    { key: "actions", label: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <Link to={`/leave/${r.id}`} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600" aria-label="View"><Eye size={16} /></Link>
        {r.status === "PENDING" && (
          <button onClick={() => setCancelTarget(r)} className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Cancel request"><X size={16} /></button>
        )}
      </div>
    )},
  ];

  return (
    <>
      <PageHeader title="Leave Management" description="View balances, requests and leave history." action={<Link to="/leave/apply"><Button><CalendarPlus size={17} /> Apply Leave</Button></Link>} />

      {loadError && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <Card title="Leave Balances (this year)">
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {balances.length === 0 && !loading && <p className="text-sm text-slate-500">No leave types have been set up yet. Ask HR to add them.</p>}
          {balances.map((b) => (
            <div key={b.leave_type} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm font-medium text-slate-800 dark:text-white">{b.leave_type_name}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{b.remaining === null ? "Unlimited" : `${b.remaining} days`}</p>
              <p className="text-xs text-slate-500">{b.used} used • {b.pending} pending{b.total > 0 ? ` • ${b.total} per year` : ""}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6" title="My Leave History">
        <DataTable columns={columns} data={leaves} loading={loading} emptyTitle="You haven't requested any leave yet" />
      </Card>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        loading={cancelling}
        title="Cancel leave request"
        message={`Cancel your ${cancelTarget?.leave_type_name} request for ${formatDate(cancelTarget?.start_date)}?`}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
