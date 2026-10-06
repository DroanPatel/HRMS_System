// Client-side checks for a better user experience. The server repeats every rule, so these are never the only defence.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[0-9+()\-\s.]{7,20}$/;
export const EMPLOYEE_CODE_RE = /^[A-Za-z0-9-]{2,20}$/;
export const MIN_PASSWORD_LENGTH = 10;

export const isEmail = (value) => EMAIL_RE.test((value || "").trim());
export const isPhone = (value) => !value || PHONE_RE.test(value.trim());

const parseYMD = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
};

export const ageOn = (ymd, today = new Date()) => {
  const { y, m, d } = parseYMD(ymd);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
};

const isFuture = (ymd, today = new Date()) => {
  const { y, m, d } = parseYMD(ymd);
  return new Date(y, m - 1, d) >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

export function validateEmployee(form, today = new Date()) {
  const errors = {};
  if (!form.employee_id.trim()) errors.employee_id = "Employee ID is required.";
  else if (!EMPLOYEE_CODE_RE.test(form.employee_id.trim())) errors.employee_id = "Use 2-20 letters, numbers or hyphens.";
  if (!form.first_name.trim()) errors.first_name = "First name is required.";
  if (!form.last_name.trim()) errors.last_name = "Last name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!isEmail(form.email)) errors.email = "Enter a valid email address.";
  if (!isPhone(form.phone)) errors.phone = "Enter a valid phone number.";
  if (!isPhone(form.emergency_contact_phone)) errors.emergency_contact_phone = "Enter a valid phone number.";
  if (!form.date_of_joining) errors.date_of_joining = "Joining date is required.";
  if (!form.department) errors.department = "Select a department.";
  if (!form.designation) errors.designation = "Select a designation.";
  if (form.date_of_birth) {
    if (isFuture(form.date_of_birth, today)) errors.date_of_birth = "Date of birth must be in the past.";
    else if (ageOn(form.date_of_birth, today) < 16) errors.date_of_birth = "Employee must be at least 16 years old.";
  }
  return errors;
}

export function validateLeave(form) {
  const errors = {};
  if (!form.leave_type) errors.leave_type = "Select a leave type.";
  if (!form.start_date) errors.start_date = "Choose a start date.";
  if (!form.end_date) errors.end_date = "Choose an end date.";
  if (form.start_date && form.end_date && form.end_date < form.start_date) errors.end_date = "End date cannot be before the start date.";
  if (!form.reason.trim()) errors.reason = "Please give a reason.";
  return errors;
}

export function validateNewPassword(password, confirm) {
  const errors = {};
  if (password.length < MIN_PASSWORD_LENGTH) errors.new_password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password !== confirm) errors.confirm_password = "Passwords do not match.";
  return errors;
}

// The optional "create a login" block on the Add Employee form
export function validateLogin(login) {
  const errors = {};
  if (login.password.length < MIN_PASSWORD_LENGTH) errors.login_password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (login.password !== login.confirm) errors.login_confirm = "Passwords do not match.";
  if (login.username.trim() && !/^[\w.@+-]{1,150}$/.test(login.username.trim())) {
    errors.login_username = "Use letters, numbers and @ . + - _ only.";
  }
  return errors;
}
