import { useEffect, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Toast from "../components/common/Toast";
import authService from "../services/authService";
import { getErrorMessage, getFieldErrors } from "../utils/apiError";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "../utils/validators";

const empty = { current_password: "", new_password: "", confirm_password: "" };

export default function Settings() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
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
    const problems = validateNewPassword(form.new_password, form.confirm_password);
    if (!form.current_password) problems.current_password = "Enter your current password.";
    if (Object.keys(problems).length) {
      setErrors(problems);
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await authService.changePassword({ current_password: form.current_password, new_password: form.new_password });
      setForm(empty);
      setToast({ message: "Password changed. Other devices were signed out.", type: "success" });
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length) setToast({ message: getErrorMessage(err, "Unable to change password."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your account security." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Change Password">
          <form className="space-y-5 p-5" onSubmit={submit} noValidate>
            <Input label="Current Password" type="password" autoComplete="current-password" value={form.current_password} error={errors.current_password} onChange={(e) => update("current_password", e.target.value)} />
            <Input label="New Password" type="password" autoComplete="new-password" value={form.new_password} error={errors.new_password} onChange={(e) => update("new_password", e.target.value)} />
            <Input label="Confirm New Password" type="password" autoComplete="new-password" value={form.confirm_password} error={errors.confirm_password} onChange={(e) => update("confirm_password", e.target.value)} />
            <p className="text-xs text-slate-500">At least {MIN_PASSWORD_LENGTH} characters. Avoid common passwords and ones similar to your name or email.</p>
            <Button type="submit" loading={saving}><Lock size={16} /> Change Password</Button>
          </form>
        </Card>
        <Card title="How your account is protected">
          <ul className="space-y-3 p-5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-3"><ShieldCheck size={18} className="shrink-0 text-emerald-600" /> You stay signed in with a secure session cookie that scripts on the page cannot read.</li>
            <li className="flex gap-3"><ShieldCheck size={18} className="shrink-0 text-emerald-600" /> Sessions expire after a period of inactivity.</li>
            <li className="flex gap-3"><ShieldCheck size={18} className="shrink-0 text-emerald-600" /> Changing your password signs you out everywhere else.</li>
            <li className="flex gap-3"><ShieldCheck size={18} className="shrink-0 text-emerald-600" /> Repeated failed sign-ins are rate-limited.</li>
          </ul>
        </Card>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
