import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

export default function Forbidden() {
  return (
    <Card>
      <div className="flex flex-col items-center p-12 text-center">
        <ShieldAlert className="text-amber-500" size={40} />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">You don't have access to this page</h1>
        <p className="mt-2 text-sm text-slate-500">Ask your HR administrator if you think you should.</p>
        <Link to="/dashboard" className="mt-6"><Button variant="secondary">Back to dashboard</Button></Link>
      </div>
    </Card>
  );
}
