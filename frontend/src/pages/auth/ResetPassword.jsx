import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import authService from "../../services/authService";
import { getErrorMessage, getFieldErrors } from "../../utils/apiError";
import { validateNewPassword } from "../../utils/validators";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const problems = validateNewPassword(form.password, form.confirmPassword);
    if (Object.keys(problems).length) {
      setFieldErrors({ password: problems.new_password, confirmPassword: problems.confirm_password });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await authService.resetPassword({ uid, token, password: form.password });
      setMessage("Password reset successfully. You can now sign in.");
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields.password) setFieldErrors({ password: fields.password });
      else setError(getErrorMessage(err, "Unable to reset password."));
    } finally {
      setLoading(false);
    }
  };

  const linkBroken = !uid || !token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold dark:text-white">Reset password</h1>
        {linkBroken && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">This reset link is incomplete. Request a new one.</div>}
        {message && <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!linkBroken && !message && (
          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            <Input label="New password" type="password" required autoComplete="new-password" value={form.password} error={fieldErrors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Input label="Confirm password" type="password" required autoComplete="new-password" value={form.confirmPassword} error={fieldErrors.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            <Button type="submit" loading={loading} className="w-full">Reset password</Button>
          </form>
        )}
        <Link to={linkBroken ? "/forgot-password" : "/login"} className="mt-5 block text-center text-sm font-medium text-blue-600">
          {linkBroken ? "Request a new link" : "Back to login"}
        </Link>
      </div>
    </div>
  );
}
