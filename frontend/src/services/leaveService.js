import api from "./api";
import { unwrapList, unwrapPage } from "../utils/pagination";

const leaveService = {
  async getLeaves(params = {}) {
    const response = await api.get("/leaves/", { params });
    return unwrapList(response.data);
  },
  async getLeavesPage(params = {}) {
    const response = await api.get("/leaves/", { params });
    return unwrapPage(response.data);
  },
  async getMyLeaves() {
    const response = await api.get("/leaves/my/");
    return unwrapList(response.data);
  },
  async getLeave(id) {
    const response = await api.get(`/leaves/${id}/`);
    return response.data;
  },
  async getBalance() {
    const response = await api.get("/leaves/balance/");
    return response.data;
  },
  async getLeaveTypes() {
    const response = await api.get("/leaves/types/");
    return unwrapList(response.data);
  },
  async applyLeave(data) {
    const response = await api.post("/leaves/", data);
    return response.data;
  },
  async approveLeave(id, comment = "") {
    const response = await api.post(`/leaves/${id}/approve/`, { comment });
    return response.data;
  },
  async rejectLeave(id, comment) {
    const response = await api.post(`/leaves/${id}/reject/`, { comment });
    return response.data;
  },
  async cancelLeave(id) {
    const response = await api.post(`/leaves/${id}/cancel/`);
    return response.data;
  },
};

export default leaveService;
