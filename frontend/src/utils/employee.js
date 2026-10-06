export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ON_LEAVE", label: "On Leave" },
];

export const employmentStatusLabel = (value) =>
  EMPLOYMENT_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const initials = (first = "", last = "") => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
