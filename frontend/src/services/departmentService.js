import api from "./api";
import { ALL_ROWS, unwrapList } from "../utils/pagination";

const departmentService = {
  async getDepartments(params = {}) {
    const response = await api.get("/departments/", { params: { ...ALL_ROWS, ...params } });
    return unwrapList(response.data);
  },
  async getDepartment(id) {
    const response = await api.get(`/departments/${id}/`);
    return response.data;
  },
  async createDepartment(data) {
    const response = await api.post("/departments/", data);
    return response.data;
  },
  async updateDepartment(id, data) {
    const response = await api.patch(`/departments/${id}/`, data);
    return response.data;
  },
  async deleteDepartment(id) {
    await api.delete(`/departments/${id}/`);
  },
};

export default departmentService;
