import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusBadge from "../../components/common/StatusBadge";
import Toast from "../../components/common/Toast";
import designationService from "../../services/designationService";
import { getErrorMessage, getFieldErrors } from "../../utils/apiError";

const emptyForm = { name: "", description: "", is_active: true };

export default function Designations() {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
      setDesignations(await designationService.getDesignations());
    } catch (err) {
      setLoadError(getErrorMessage(err, "Unable to load designations."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name, description: row.description || "", is_active: row.is_active });
    setFieldErrors({});
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) setModalOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    setFieldErrors({});
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      is_active: form.is_active,
    };
    try {
      if (editing) await designationService.updateDesignation(editing.id, payload);
      else await designationService.createDesignation(payload);
      setModalOpen(false);
      setToast({ message: editing ? "Designation updated." : "Designation created.", type: "success" });
      await load();
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
      const hasFieldErrors = ["name", "description"].some((key) => errors[key]);
      setFormError(errors.non_field_errors || errors.detail || (hasFieldErrors ? "" : getErrorMessage(err, "Unable to save designation.")));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await designationService.deleteDesignation(deleteTarget.id);
      setDeleteTarget(null);
      setToast({ message: "Designation deleted.", type: "success" });
      await load();
    } catch (err) {
      setDeleteTarget(null);
      setToast({ message: getErrorMessage(err, "Unable to delete designation."), type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "name", label: "Designation", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.name}</span> },
    { key: "description", label: "Description", render: (r) => r.description || "—" },
    { key: "is_active", label: "Status", render: (r) => <StatusBadge status={r.is_active ? "Active" : "Inactive"} /> },
    { key: "actions", label: "Actions", render: (r) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-2 text-slate-500 hover:text-blue-600" aria-label="Edit"><Pencil size={16} /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-2 text-slate-500 hover:text-red-600" aria-label="Delete"><Trash2 size={16} /></button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader title="Designations" description="Manage job titles." action={<Button onClick={openCreate}><Plus size={17} /> Add Designation</Button>} />

      {loadError && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <Card><DataTable columns={columns} data={designations} loading={loading} emptyTitle="No designations yet" /></Card>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit Designation" : "Add Designation"}>
        <form className="space-y-5" onSubmit={submit}>
          {formError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <Input label="Designation Name" required value={form.name} error={fieldErrors.name} onChange={(e) => update("name", e.target.value)} />
          <Input label="Description" value={form.description} error={fieldErrors.description} onChange={(e) => update("description", e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" className="rounded" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} /> Active
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save Changes" : "Create Designation"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete designation"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
