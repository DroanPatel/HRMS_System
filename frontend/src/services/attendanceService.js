import api from "./api";
import { unwrapList, unwrapPage } from "../utils/pagination";

const attendanceService = {
  async getAttendance(params = {}) {
    const response = await api.get("/attendance/", { params });
    return unwrapList(response.data);
  },
  async getAttendancePage(params = {}) {
    const response = await api.get("/attendance/", { params });
    return unwrapPage(response.data);
  },
  async getSummary(params = {}) {
    const response = await api.get("/attendance/summary/", { params });
    return response.data;
  },
  async getMyAttendance(params = {}) {
    const response = await api.get("/attendance/my/", { params });
    return unwrapList(response.data);
  },
  async getToday() {
    const response = await api.get("/attendance/today/");
    return response.data; // { attendance: {...} | null }
  },
  async checkIn() {
    const response = await api.post("/attendance/check-in/");
    return response.data;
  },
  async checkOut() {
    const response = await api.post("/attendance/check-out/");
    return response.data;
  },
};

export default attendanceService;
