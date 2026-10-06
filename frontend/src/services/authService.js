import api from "./api";

// Backend sends role codes; the sidebar/topbar show display labels.
// `roleCode` keeps the raw value for permission checks.
const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "HR Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

const normalizeUser = (user) => ({
  ...user,
  roleCode: user.role,
  role: ROLE_LABELS[user.role] || user.role,
});

const authService = {
  async login({ email, password }) {
    await api.get("/auth/csrf/"); // sets the csrftoken cookie
    // Django's login view takes a "username" field that accepts username OR email.
    const response = await api.post("/auth/login/", { username: email, password });
    return normalizeUser(response.data.user);
  },

  async logout() {
    await api.post("/auth/logout/");
  },

  async getCurrentUser() {
    const response = await api.get("/auth/me/");
    return normalizeUser(response.data.user);
  },

  async updateProfile(data) {
    const response = await api.patch("/auth/me/", data);
    return normalizeUser(response.data.user);
  },

  async changePassword({ current_password, new_password }) {
    const response = await api.post("/auth/change-password/", { current_password, new_password });
    return response.data;
  },

  async forgotPassword(email) {
    await api.get("/auth/csrf/");
    const response = await api.post("/auth/forgot-password/", { email });
    return response.data; // { message }
  },

  async resetPassword({ uid, token, password }) {
    await api.get("/auth/csrf/");
    const response = await api.post("/auth/reset-password/", { uid, token, password });
    return response.data;
  },
};

export default authService;
