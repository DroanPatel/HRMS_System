import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Breadcrumb from "../../components/common/Breadcrumb";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import leaveService from "../../services/leaveService";
import { getErrorMessage, getFieldErrors } from "../../utils/apiError";
import { validateLeave } from "../../utils/validators";

const emptyForm = { leave_type: "", start_date: "", end_date: "", reason: "" };

const dayCount = (start, end) => {
  if (!start || !end) return null;
  const days = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
  return days > 0 ? days : null;
};

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [types, setTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [typeData, balanceData] = await Promise.all([leaveService.getLeaveTypes(), leaveService.getBalance()]);
        if (!cancelled) {
          setTypes(typeData);
          setBalances(balanceData);
        }
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Unable to load leave types."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const days = dayCount(form.start_date, form.end_date);
  const balance = balances.find((b) => String(b.leave_type) === form.leave_type);

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = validateLeave(form);
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      setFormError("");
      return;
    }
    setSaving(true);
    setFormError("");
    setFieldErrors({});
    try {
      await leaveService.applyLeave({ ...form, leave_type: Number(form.leave_type), reason: form.reason.trim() });
      navigate("/leave");
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
      const known = Object.keys(emptyForm).some((key) => errors[key]);
      setFormError(errors.non_field_errors || errors.detail || (known ? "" : getErrorMessage(err, "Unable to submit request.")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-16"><LoadingSpinner size="lg" /></div>;

  return (
    <>
      <Breadcrumb items={[{ label: "Leave", to: "/leave" }, { label: "Apply Leave" }]} />
      <PageHeader title="Apply Leave" description="Submit a leave request for approval." />
      {loadError && <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
      <form onSubmit={submit}>
        <Card title="Leave Request">
          <div className="grid gap-5 p-5 md:grid-cols-2">
            {formError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">{formError}</div>}
            <div>
              <Select label="Leave Type" required value={form.leave_type} error={fieldErrors.leave_type} onChange={(e) => update("leave_type", e.target.value)} options={types.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select leave type" />
              {balance && <p className="mt-1.5 text-xs text-slate-500">{balance.remaining === null ? "No limit for this leave type." : `${balance.remaining} day(s) remaining this year.`}</p>}
            </div>
            <div className="flex items-end pb-1 text-sm text-slate-600 dark:text-slate-300">{days ? `${days} day(s) requested` : ""}</div>
            <Input label="From" type="date" required value={form.start_date} error={fieldErrors.start_date} onChange={(e) => update("start_date", e.target.value)} />
            <Input label="To" type="date" required min={form.start_date || undefined} value={form.end_date} error={fieldErrors.end_date} onChange={(e) => update("end_date", e.target.value)} />
            <div className="md:col-span-2">
              <Input label="Reason" required value={form.reason} error={fieldErrors.reason} onChange={(e) => update("reason", e.target.value)} placeholder="Explain the reason for your leave..." />
            </div>
          </div>
        </Card>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={saving}>Submit Request</Button>
        </div>
      </form>
    </>
  );
}
