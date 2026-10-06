import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Breadcrumb from "../../components/common/Breadcrumb";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import employeeService from "../../services/employeeService";
import departmentService from "../../services/departmentService";
import designationService from "../../services/designationService";
import { getErrorMessage, getFieldErrors } from "../../utils/apiError";
import { EMPLOYMENT_STATUS_OPTIONS } from "../../utils/employee";
import { validateEmployee, validateLogin } from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";
import { assignableRoles } from "../../utils/roles";

const emptyLogin = { username: "", role: "EMPLOYEE", password: "", confirm: "" };

const emptyForm = {
  employee_id: "", first_name: "", last_name: "", email: "", phone: "", date_of_birth: "",
  date_of_joining: "", department: "", designation: "", manager: "", employment_status: "ACTIVE",
  address: "", emergency_contact_name: "", emergency_contact_phone: "",
};

// Suggest the next ID (EMP001, EMP002...) from the IDs that already exist.
const nextEmployeeId = (employees) => {
  const numbers = employees.map((e) => /^EMP(\d+)$/.exec(e.employee_id)?.[1]).filter(Boolean).map(Number);
  return `EMP${String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(3, "0")}`;
};

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [createLogin, setCreateLogin] = useState(true);
  const [login, setLogin] = useState(emptyLogin);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [depts, desigs, emps, existing] = await Promise.all([
          departmentService.getDepartments(),
          designationService.getDesignations(),
          employeeService.getEmployees(),
          id ? employeeService.getEmployee(id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setDepartments(depts);
        setDesignations(desigs);
        setEmployees(emps);
        if (existing) {
          setForm({
            employee_id: existing.employee_id, first_name: existing.first_name, last_name: existing.last_name,
            email: existing.email, phone: existing.phone || "", date_of_birth: existing.date_of_birth || "",
            date_of_joining: existing.date_of_joining, department: String(existing.department),
            designation: String(existing.designation), manager: existing.manager ? String(existing.manager) : "",
            employment_status: existing.employment_status, address: existing.address || "",
            emergency_contact_name: existing.emergency_contact_name || "",
            emergency_contact_phone: existing.emergency_contact_phone || "",
          });
        } else {
          setForm({ ...emptyForm, employee_id: nextEmployeeId(emps) });
        }
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Unable to load the form."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateLogin = (key, value) => setLogin((current) => ({ ...current, [key]: value }));

  // Only offer active departments/designations (but keep the current one when editing).
  const departmentOptions = departments
    .filter((d) => d.is_active || String(d.id) === form.department)
    .map((d) => ({ value: d.id, label: d.name }));
  const designationOptions = designations
    .filter((d) => d.is_active || String(d.id) === form.designation)
    .map((d) => ({ value: d.id, label: d.name }));
  const managerOptions = employees
    .filter((e) => String(e.id) !== String(id))
    .map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_id})` }));

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = validateEmployee(form);
    if (!id && createLogin) Object.assign(clientErrors, validateLogin(login));
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    setFormError("");
    setFieldErrors({});
    const payload = {
      ...form,
      employee_id: form.employee_id.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      department: Number(form.department),
      designation: Number(form.designation),
      manager: form.manager ? Number(form.manager) : null,
      date_of_birth: form.date_of_birth || null,
    };
    if (!id && createLogin) {
      // the server creates the employee and their login in one step (both or neither)
      payload.login = { role: login.role, password: login.password };
      if (login.username.trim()) payload.login.username = login.username.trim();
    }
    try {
      const saved = id ? await employeeService.updateEmployee(id, payload) : await employeeService.createEmployee(payload);
      navigate(`/employees/${saved.id}`);
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
      const known = [...Object.keys(emptyForm), "login_username", "login_role", "login_password"].some((key) => errors[key]);
      setFormError(errors.non_field_errors || errors.detail || (known ? "Please fix the highlighted fields." : getErrorMessage(err, "Unable to save employee.")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-16"><LoadingSpinner size="lg" /></div>;

  if (loadError) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {loadError} <Button size="sm" variant="outline" className="ml-3" onClick={() => navigate("/employees")}>Back to employees</Button>
      </div>
    );
  }

  const field = (key, label, extra = {}) => (
    <Input label={label} value={form[key]} error={fieldErrors[key]} onChange={(e) => update(key, e.target.value)} {...extra} />
  );

  return (
    <>
      <Breadcrumb items={[{ label: "Employees", to: "/employees" }, { label: id ? "Edit Employee" : "Add Employee" }]} />
      <PageHeader title={id ? "Edit Employee" : "Add Employee"} description={id ? "Update employee information." : "Create a new employee record."} />
      <form onSubmit={submit} className="space-y-6">
        {formError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}

        <Card title="Personal Information">
          <div className="grid gap-5 p-5 md:grid-cols-2">
            {field("first_name", "First Name", { required: true })}
            {field("last_name", "Last Name", { required: true })}
            {field("email", "Email", { type: "email", required: true })}
            {field("phone", "Phone", { type: "tel" })}
            {field("date_of_birth", "Date of Birth", { type: "date", max: new Date().toISOString().slice(0, 10) })}
            {field("address", "Address")}
            {field("emergency_contact_name", "Emergency Contact Name")}
            {field("emergency_contact_phone", "Emergency Contact Phone", { type: "tel" })}
          </div>
        </Card>

        <Card title="Employment Information">
          <div className="grid gap-5 p-5 md:grid-cols-2">
            {field("employee_id", "Employee ID", { required: true })}
            <Select label="Department" required value={form.department} error={fieldErrors.department} onChange={(e) => update("department", e.target.value)} options={departmentOptions} placeholder="Select department" />
            <Select label="Designation" required value={form.designation} error={fieldErrors.designation} onChange={(e) => update("designation", e.target.value)} options={designationOptions} placeholder="Select designation" />
            <Select label="Manager" value={form.manager} error={fieldErrors.manager} onChange={(e) => update("manager", e.target.value)} options={managerOptions} placeholder="No manager" />
            {field("date_of_joining", "Joining Date", { type: "date", required: true })}
            <Select label="Employment Status" value={form.employment_status} error={fieldErrors.employment_status} onChange={(e) => update("employment_status", e.target.value)} options={EMPLOYMENT_STATUS_OPTIONS} placeholder="Select status" />
          </div>
        </Card>

        {!id && (
          <Card title="Login Account">
            <div className="space-y-5 p-5">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input type="checkbox" className="rounded" checked={createLogin} onChange={(e) => setCreateLogin(e.target.checked)} />
                Create a login so this employee can sign in
              </label>
              {createLogin ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Input label="Username (optional)" placeholder={(form.employee_id || "emp001").toLowerCase()} value={login.username} error={fieldErrors.login_username} onChange={(e) => updateLogin("username", e.target.value)} />
                  <Select label="Role" value={login.role} error={fieldErrors.login_role} onChange={(e) => updateLogin("role", e.target.value)} options={assignableRoles(user)} placeholder="Select role" />
                  <Input label="Password" type="password" autoComplete="new-password" value={login.password} error={fieldErrors.login_password} onChange={(e) => updateLogin("password", e.target.value)} />
                  <Input label="Confirm Password" type="password" autoComplete="new-password" value={login.confirm} error={fieldErrors.login_confirm} onChange={(e) => updateLogin("confirm", e.target.value)} />
                  <p className="text-xs text-slate-500 md:col-span-2">
                    At least 10 characters. They can sign in with this username or with their email address{form.email ? ` (${form.email})` : ""}, and can change the password later in Settings.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">You can create a login later from the employee's page.</p>
              )}
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={saving}>{id ? "Save Changes" : "Create Employee"}</Button>
        </div>
      </form>
    </>
  );
}
