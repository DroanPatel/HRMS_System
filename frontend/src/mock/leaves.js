export const mockLeaves = [
  { id: 1, employee: "Sarah Williams", employeeId: "EMP003", type: "Annual Leave", from: "2026-09-29", to: "2026-10-02", days: 4, status: "Approved", reason: "Family vacation" },
  { id: 2, employee: "Emily Davis", employeeId: "EMP005", type: "Sick Leave", from: "2026-09-29", to: "2026-09-30", days: 2, status: "Approved", reason: "Medical appointment" },
  { id: 3, employee: "John Doe", employeeId: "EMP002", type: "Casual Leave", from: "2026-10-05", to: "2026-10-06", days: 2, status: "Pending", reason: "Personal work" },
  { id: 4, employee: "Olivia Taylor", employeeId: "EMP007", type: "Annual Leave", from: "2026-10-12", to: "2026-10-16", days: 5, status: "Pending", reason: "Travel" },
  { id: 5, employee: "Daniel Wilson", employeeId: "EMP006", type: "Casual Leave", from: "2026-09-21", to: "2026-09-21", days: 1, status: "Rejected", reason: "Team deadline" },
];

export const mockLeaveBalance = {
  Annual: { total: 20, used: 8, pending: 2 },
  Sick: { total: 10, used: 3, pending: 0 },
  Casual: { total: 8, used: 2, pending: 1 },
};
