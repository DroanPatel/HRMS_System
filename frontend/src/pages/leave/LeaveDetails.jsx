import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import Breadcrumb from "../../components/common/Breadcrumb";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import ReasonModal from "../../components/common/ReasonModal";
import Toast from "../../components/common/Toast";
import { useAuth } from "../../context/AuthContext";
import leaveService from "../../services/leaveService";
import { getErrorMessage } from "../../utils/apiError";
import { formatDate } from "../../utils/dateTime";
import { LEAVE_STATUS, REVIEWER_ROLES } from "../../utils/labels";

export default function LeaveDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLeave(await leaveService.getLeave(id));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load leave request."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (action, message) => {
    setActing(true);
    try {
      await action();
      setRejecting(false);
      setToast({ message, type: "success" });
      await load();
    } catch (err) {
      setRejecting(false);
      setToast({ message: getErrorMessage(err, "Unable to update request."), type: "error" });
    } finally {
      setActing(false);
    }
  };

  const canReview = REVIEWER_ROLES.includes(user?.roleCode);
  const backTo = canReview ? "/leave/requests" : "/leave";

  if (loading) return <div className="flex justify-center p-16"><LoadingSpinner size="lg" /></div>;
  if (error || !leave) {
    return (
      <Card>
        <EmptyState title="Leave request unavailable" description={error || "Leave request not found."} />
        <div className="flex justify-center pb-8"><Link to={backTo}><Button variant="secondary">Go back</Button></Link></div>
      </Card>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: canReview ? "Leave Requests" : "Leave", to: backTo }, { label: "Request Details" }]} />
      <PageHeader title="Leave Request Details" description={`${leave.employee_name} • ${leave.leave_type_name}`} />
      <Card>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <Info label="Employee" value={`${leave.employee_name} (${leave.employee_code})`} />
          <Info label="Status" value={<StatusBadge status={LEAVE_STATUS[leave.status] || leave.status} />} />
          <Info label="Leave Type" value={leave.leave_type_name} />
          <Info label="Number of Days" value={`${leave.total_days} day(s)`} />
          <Info label="From" value={formatDate(leave.start_date)} />
          <Info label="To" value={formatDate(leave.end_date)} />
          <div className="sm:col-span-2"><Info label="Reason" value={leave.reason} /></div>
          {leave.reviewed_by_name && <Info label="Reviewed By" value={leave.reviewed_by_name} />}
          {leave.reviewed_at && <Info label="Reviewed On" value={formatDate(leave.reviewed_at.slice(0, 10))} />}
          {leave.reviewer_comment && <div className="sm:col-span-2"><Info label="Reviewer Comment" value={leave.reviewer_comment} /></div>}
        </div>
        {leave.status === "PENDING" && canReview && (
          <div className="flex justify-end gap-2 border-t border-slate-100 p-5 dark:border-slate-800">
            <Button variant="danger" disabled={acting} onClick={() => setRejecting(true)}>Reject</Button>
            <Button variant="success" loading={acting} onClick={() => review(() => leaveService.approveLeave(leave.id), "Leave approved.")}>Approve</Button>
          </div>
        )}
      </Card>

      <ReasonModal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject leave request"
        label="Reason for rejection"
        confirmLabel="Reject Request"
        loading={acting}
        onSubmit={(comment) => review(() => leaveService.rejectLeave(leave.id, comment), "Leave rejected.")}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs text-slate-500">{label}</p><div className="mt-1 font-medium text-slate-800 dark:text-slate-200">{value}</div></div>;
}
