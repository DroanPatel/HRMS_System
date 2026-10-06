import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Forbidden from "../pages/Forbidden";

// Wrap routes that only some roles may open. The server enforces the same rules; this just gives a clear page.
export default function RoleRoute({ roles }) {
  const { user } = useAuth();
  if (!roles.includes(user?.roleCode)) return <Forbidden />;
  return <Outlet />;
}
