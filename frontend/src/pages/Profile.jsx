import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Toast from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";
import { getErrorMessage, getFieldErrors } from "../utils/apiError";
import { isPhone } from "../utils/validators";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone: user?.phone || "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!isPhone(form.phone)) {
      setFieldErrors({ phone: "Enter a valid phone number." });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      updateUser(await authService.updateProfile({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), phone: form.phone.trim() }));
      setToast({ message: "Profile updated.", type: "success" });
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
      if (!Object.keys(errors).length) setToast({ message: getErrorMessage(err, "Unable to update profile."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username;

  return (
    <>
      <PageHeader title="My Profile" description="View and update your profile information." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="p-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
              {(user?.first_name?.[0] || user?.username?.[0] || "?").toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
            </div>
            <h2 className="mt-4 text-xl font-bold dark:text-white">{fullName}</h2>
            <p className="text-sm text-slate-500">{user?.designation || user?.role}</p>
            <dl className="mt-5 space-y-2 text-left text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Employee ID</dt><dd className="font-medium dark:text-white">{user?.employee_id || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Department</dt><dd className="font-medium dark:text-white">{user?.department || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd className="font-medium dark:text-white">{user?.role}</dd></div>
            </dl>
          </div>
        </Card>
        <Card title="Profile Information" className="lg:col-span-2">
          <form className="grid gap-5 p-5 md:grid-cols-2" onSubmit={submit} noValidate>
            <Input label="First Name" value={form.first_name} error={fieldErrors.first_name} onChange={(e) => update("first_name", e.target.value)} />
            <Input label="Last Name" value={form.last_name} error={fieldErrors.last_name} onChange={(e) => update("last_name", e.target.value)} />
            <Input label="Email" type="email" value={user?.email || ""} disabled readOnly />
            <Input label="Phone" type="tel" value={form.phone} error={fieldErrors.phone} onChange={(e) => update("phone", e.target.value)} />
            <p className="text-xs text-slate-500 md:col-span-2">Your email, role and department are managed by HR.</p>
            <div className="flex justify-end md:col-span-2"><Button type="submit" loading={saving}>Save Changes</Button></div>
          </form>
        </Card>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
