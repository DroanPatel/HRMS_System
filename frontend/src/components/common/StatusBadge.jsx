import Badge from "./Badge";

const map = {
  Active: "success",
  Present: "success",
  Approved: "success",
  Paid: "success",
  Pending: "warning",
  Late: "warning",
  "On Leave": "info",
  "Half Day": "info",
  Rejected: "danger",
  Absent: "danger",
  Inactive: "danger",
};

export default function StatusBadge({ status }) {
  return <Badge variant={map[status] || "default"}>{status}</Badge>;
}
