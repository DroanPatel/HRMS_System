// Turns Django REST Framework errors into messages the UI can show.

// 400 validation errors look like { name: ["already exists."], code: ["..."] }.
// Returns { name: "already exists.", code: "..." } for showing under each input.
export function getFieldErrors(error) {
  const data = error?.response?.data;
  if (error?.response?.status !== 400 || !data || typeof data !== "object") return {};
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.join(" ") : String(value)]),
  );
}

export function getErrorMessage(error, fallback = "Something went wrong.") {
  if (!error?.response) return "Cannot reach the server. Is Django running?";
  const { status, data } = error.response;
  if (status === 403) return "You don't have permission to do this.";
  if (status === 404) return "Record not found.";
  if (status >= 500) return "Server error. Please try again.";
  if (typeof data?.detail === "string") return data.detail;
  const first = Object.values(getFieldErrors(error))[0];
  return first || fallback;
}
