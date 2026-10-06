import api from "./api";
import { ALL_ROWS, unwrapList, unwrapPage } from "../utils/pagination";

const employeeService = {
  // everything (for dropdowns)
  async getEmployees(params = {}) {
    const response = await api.get("/employees/", { params: { ...ALL_ROWS, ...params } });
    return unwrapList(response.data);
  },
  // one page + total (for tables): pass { page, page_size, search, ... }
  async getEmployeesPage(params = {}) {
    const response = await api.get("/employees/", { params });
    return unwrapPage(response.data);
  },
  async getEmployee(id) {
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  },
  async createEmployee(data) {
    const response = await api.post("/employees/", data);
    return response.data;
  },
  async updateEmployee(id, data) {
    const response = await api.patch(`/employees/${id}/`, data);
    return response.data;
  },
  async deleteEmployee(id) {
    await api.delete(`/employees/${id}/`);
  },
  async createAccount(id, data) {
    const response = await api.post(`/employees/${id}/create-account/`, data);
    return response.data;
  },
  async updateAccount(id, data) {
    const response = await api.post(`/employees/${id}/update-account/`, data);
    return response.data;
  },
};

export default employeeService;
