export const ATTENDANCE_STATUS = { PRESENT: "Present", ABSENT: "Absent", HALF_DAY: "Half Day", ON_LEAVE: "On Leave" };
export const LEAVE_STATUS = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", CANCELLED: "Cancelled" };

const toOptions = (map) => Object.entries(map).map(([value, label]) => ({ value, label }));
export const ATTENDANCE_STATUS_OPTIONS = toOptions(ATTENDANCE_STATUS);
export const LEAVE_STATUS_OPTIONS = toOptions(LEAVE_STATUS);

export const REVIEWER_ROLES = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"];
