export const HR_ROLES = ["SUPER_ADMIN", "HR_ADMIN"];
export const TEAM_ROLES = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]; // can see other people's records

export const isHR = (user) => HR_ROLES.includes(user?.roleCode);
export const isTeamViewer = (user) => TEAM_ROLES.includes(user?.roleCode);

export const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Manager" },
  { value: "HR_ADMIN", label: "HR Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

// Mirrors the server rule: HR Admins may only hand out Employee/Manager logins.
export const assignableRoles = (user) =>
  user?.roleCode === "SUPER_ADMIN" ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => ["EMPLOYEE", "MANAGER"].includes(r.value));
