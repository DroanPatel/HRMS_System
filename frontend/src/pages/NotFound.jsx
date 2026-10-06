import { Link } from "react-router-dom";
import Button from "../components/common/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="text-center">
        <p className="text-7xl font-bold text-blue-600">404</p>
        <h1 className="mt-4 text-2xl font-bold dark:text-white">Page not found</h1>
        <p className="mt-2 text-slate-500">The page you requested does not exist.</p>
        <Link to="/dashboard" className="mt-6 inline-block"><Button>Back to dashboard</Button></Link>
      </div>
    </div>
  );
}
