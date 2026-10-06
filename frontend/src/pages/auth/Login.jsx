import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (err.response ? "Unable to sign in." : "Cannot reach the server. Is Django running?"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="hidden w-1/2 bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="text-2xl font-bold text-blue-400">HRMS</div>
          <p className="mt-2 text-sm text-slate-400">Human Resource Management System</p>
        </div>
        <div>
          <h1 className="max-w-lg text-4xl font-bold leading-tight">Manage your people, attendance and leave in one place.</h1>
          <p className="mt-5 max-w-lg text-slate-400">A scalable HR platform designed for employees, managers and HR teams.</p>
        </div>
        <p className="text-xs text-slate-500">Phase 1 • Authentication & Core HR</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="text-2xl font-bold text-blue-600">HRMS</div>
            <p className="text-sm text-slate-500">Human Resource Management System</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your HRMS account.</p>
            </div>

            {error && <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={submit} className="space-y-5">
              <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-9 text-slate-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input type="checkbox" className="rounded" /> Remember me
                </label>
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">Forgot password?</Link>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                <LockKeyhole size={16} /> Sign in
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
