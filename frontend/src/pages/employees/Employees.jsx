import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import SearchBar from "../../components/common/SearchBar";
import Select from "../../components/common/Select";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Toast from "../../components/common/Toast";
import { useAuth } from "../../context/AuthContext";
import employeeService from "../../services/employeeService";
import departmentService from "../../services/departmentService";
import { getErrorMessage } from "../../utils/apiError";
import { EMPLOYMENT_STATUS_OPTIONS, employmentStatusLabel, initials } from "../../utils/employee";
import { isHR } from "../../utils/roles";

const PAGE_SIZE = 15;

export default function Employees() {
  const { user } = useAuth();
  const canEdit = isHR(user);

  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    departmentService.getDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setLoadError("");
    const params = { page, page_size: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (department) params.department = department;
    if (status) params.employment_status = status;
    try {
      const data = await employeeService.getEmployeesPage(params);
      if (current !== requestId.current) return;
      if (data.results.length === 0 && page > 1) {
        setPage(page - 1); // the last row of this page was removed
        return;
      }
      setEmployees(data.results);
      setTotal(data.count);
    } catch (err) {
      if (current === requestId.current) setLoadError(getErrorMessage(err, "Unable to load employees."));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [page, debouncedSearch, department, status]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await employeeService.deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      setToast({ message: "Employee deleted.", type: "success" });
      await load();
    } catch (err) {
      setDeleteTarget(null);
      setToast({ message: getErrorMessage(err, "Unable to delete employee."), type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "employee", label: "Employee", render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">{initials(row.first_name, row.last_name)}</div>
        <div>
          <Link to={`/employees/${row.id}`} className="font-medium text-slate-900 hover:text-blue-600 dark:text-white">{row.full_name}</Link>
          <p className="text-xs text-slate-500">{row.employee_id}</p>
        </div>
      </div>
    )},
    { key: "department_name", label: "Department" },
    { key: "designation_name", label: "Designation" },
    { key: "manager_name", label: "Manager", render: (row) => row.manager_name || "—" },
    { key: "employment_status", label: "Status", render: (row) => <StatusBadge status={employmentStatusLabel(row.employment_status)} /> },
    { key: "date_of_joining", label: "Joining Date" },
    { key: "actions", label: "Actions", render: (row) => (
      <div className="flex items-center gap-1">
        <Link to={`/employees/${row.id}`} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600" aria-label="View"><Eye size={16} /></Link>
        {canEdit && <Link to={`/employees/${row.id}/edit`} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600" aria-label="Edit"><Pencil size={16} /></Link>}
        {canEdit && <button onClick={() => setDeleteTarget(row)} className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={16} /></button>}
      </div>
    )},
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        description={canEdit ? "Manage employee records and profiles." : "Your team."}
        action={canEdit ? <Link to="/employees/new"><Button><Plus size={17} /> Add Employee</Button></Link> : null}
      />

      {loadError && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-5 dark:border-slate-800 md:grid-cols-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search employees..." />
          <Select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} options={departments.map((d) => ({ value: d.id, label: d.name }))} placeholder="All departments" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={EMPLOYMENT_STATUS_OPTIONS} placeholder="All statuses" />
        </div>
        <DataTable columns={columns} data={employees} loading={loading} emptyTitle="No employees found" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete employee"
        message={`Delete ${deleteTarget?.full_name} (${deleteTarget?.employee_id})? This also removes their attendance and leave records.`}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
