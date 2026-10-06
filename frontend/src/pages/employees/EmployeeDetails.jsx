import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Mail, Phone, Pencil, CalendarDays, BriefcaseBusiness, KeyRound } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import StatusBadge from "../../components/common/StatusBadge";
import Breadcrumb from "../../components/common/Breadcrumb";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/common/Toast";
import { useAuth } from "../../context/AuthContext";
import employeeService from "../../services/employeeService";
import { getErrorMessage, getFieldErrors } from "../../utils/apiError";
import { employmentStatusLabel, initials } from "../../utils/employee";
import { ROLE_OPTIONS, assignableRoles, isHR } from "../../utils/roles";
import { MIN_PASSWORD_LENGTH } from "../../utils/validators";

function AccountCard({ employee, onChange, notify }) {
  const { user } = useAuth();
  const roles = assignableRoles(user);
  const hasAccount = employee.has_account;
  const ownAccount = hasAccount && employee.account_username === user?.username;
  const manageable = user?.roleCode === "SUPER_ADMIN" || ["EMPLOYEE", "MANAGER"].includes(employee.account_role);

  const [form, setForm] = useState({ username: "", role: employee.account_role || "EMPLOYEE", password: "", is_active: employee.account_active ?? true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({ username: "", role: employee.account_role || "EMPLOYEE", password: "", is_active: employee.account_active ?? true });
  }, [employee.account_role, employee.account_active, employee.has_account]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    let payload;
    if (!hasAccount) {
      if (form.password.length < MIN_PASSWORD_LENGTH) {
        setErrors({ password: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
        return;
      }
      payload = { password: form.password, role: form.role };
      if (form.username.trim()) payload.username = form.username.trim();
    } else {
      payload = {};
      if (!ownAccount && form.role !== employee.account_role) payload.role = form.role;
      if (!ownAccount && form.is_active !== employee.account_active) payload.is_active = form.is_active;
      if (form.password) payload.password = form.password;
      if (Object.keys(payload).length === 0) {
        notify("Nothing to update.", "error");
        return;
      }
    }
    setBusy(true);
    try {
      const updated = hasAccount ? await employeeService.updateAccount(employee.id, payload) : await employeeService.createAccount(employee.id, payload);
      onChange(updated);
      notify(hasAccount ? "Account updated." : "Login account created.", "success");
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length || fields.detail) notify(fields.detail || getErrorMessage(err, "Unable to save the account."), "error");
    } finally {
      setBusy(false);
    }
  };

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === employee.account_role)?.label || employee.account_role;

  return (
    <Card title="Login Account" action={<KeyRound size={18} className="text-slate-400" />}>
      <div className="p-5">
        {hasAccount && (
          <div className="mb-5 grid gap-4 text-sm sm:grid-cols-3">
            <div><p className="text-xs text-slate-500">Username</p><p className="font-medium dark:text-white">{employee.account_username}</p></div>
            <div><p className="text-xs text-slate-500">Role</p><p className="font-medium dark:text-white">{roleLabel}</p></div>
            <div><p className="text-xs text-slate-500">Status</p><StatusBadge status={employee.account_active ? "Active" : "Inactive"} /></div>
          </div>
        )}
        {hasAccount && !manageable ? (
          <p className="text-sm text-slate-500">Only a Super Admin can change this account.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            {!hasAccount && <p className="text-sm text-slate-500 sm:col-span-2">This employee can't sign in yet. Create a login so they can check in and request leave.</p>}
            {!hasAccount && <Input label="Username (optional)" placeholder={employee.employee_id.toLowerCase()} value={form.username} error={errors.username} onChange={(e) => update("username", e.target.value)} />}
            <Select label="Role" value={form.role} error={errors.role} disabled={ownAccount} onChange={(e) => update("role", e.target.value)} options={roles.some((r) => r.value === form.role) ? roles : ROLE_OPTIONS} placeholder="Select role" />
            <Input label={hasAccount ? "Reset password (optional)" : "Initial password"} type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(e) => update("password", e.target.value)} />
            {hasAccount && (
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700 dark:text-slate-200">
                <input type="checkbox" className="rounded" checked={form.is_active} disabled={ownAccount} onChange={(e) => update("is_active", e.target.checked)} /> Account active
              </label>
            )}
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" loading={busy}>{hasAccount ? "Save Account Changes" : "Create Login"}</Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}

export default function EmployeeDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = isHR(user);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await employeeService.getEmployee(id);
        if (!cancelled) setEmployee(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Unable to load employee."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="flex justify-center p-16"><LoadingSpinner size="lg" /></div>;
  if (error || !employee) {
    return (
      <Card>
        <EmptyState title="Employee unavailable" description={error || "Employee not found."} />
        <div className="flex justify-center pb-8"><Link to="/employees"><Button variant="secondary">Back to employees</Button></Link></div>
      </Card>
    );
  }

  const dash = (value) => value || "—";

  return (
    <>
      <Breadcrumb items={[{ label: "Employees", to: "/employees" }, { label: employee.full_name }]} />
      <PageHeader
        title={employee.full_name}
        description={`${employee.employee_id} • ${employee.designation_name}`}
        action={canEdit ? <Link to={`/employees/${employee.id}/edit`}><Button><Pencil size={16} /> Edit</Button></Link> : null}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="p-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">{initials(employee.first_name, employee.last_name)}</div>
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{employee.full_name}</h2>
            <p className="text-sm text-slate-500">{employee.designation_name}</p>
            <div className="mt-4"><StatusBadge status={employmentStatusLabel(employee.employment_status)} /></div>
            <div className="mt-6 space-y-3 text-left text-sm text-slate-600 dark:text-slate-300">
              <p className="flex gap-3"><Mail size={17} className="text-slate-400" />{employee.email}</p>
              <p className="flex gap-3"><Phone size={17} className="text-slate-400" />{dash(employee.phone)}</p>
              <p className="flex gap-3"><CalendarDays size={17} className="text-slate-400" />Joined {employee.date_of_joining}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Employment Information">
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Info label="Employee ID" value={employee.employee_id} icon={BriefcaseBusiness} />
              <Info label="Department" value={employee.department_name} />
              <Info label="Designation" value={employee.designation_name} />
              <Info label="Manager" value={dash(employee.manager_name)} />
              <Info label="Joining Date" value={employee.date_of_joining} />
              <Info label="Status" value={employmentStatusLabel(employee.employment_status)} />
            </div>
          </Card>

          <Card title="Personal Information">
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Info label="Date of Birth" value={dash(employee.date_of_birth)} />
              <Info label="Phone" value={dash(employee.phone)} />
              <Info label="Emergency Contact" value={employee.emergency_contact_name ? `${employee.emergency_contact_name} • ${dash(employee.emergency_contact_phone)}` : "—"} />
              <div className="sm:col-span-2"><Info label="Address" value={dash(employee.address)} /></div>
            </div>
          </Card>

          {canEdit && <AccountCard employee={employee} onChange={setEmployee} notify={(message, type) => setToast({ message, type })} />}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{value}</p></div>;
}
