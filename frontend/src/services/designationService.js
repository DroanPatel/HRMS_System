import api from "./api";
import { ALL_ROWS, unwrapList } from "../utils/pagination";

const designationService = {
  async getDesignations(params = {}) {
    const response = await api.get("/designations/", { params: { ...ALL_ROWS, ...params } });
    return unwrapList(response.data);
  },
  async getDesignation(id) {
    const response = await api.get(`/designations/${id}/`);
    return response.data;
  },
  async createDesignation(data) {
    const response = await api.post("/designations/", data);
    return response.data;
  },
  async updateDesignation(id, data) {
    const response = await api.patch(`/designations/${id}/`, data);
    return response.data;
  },
  async deleteDesignation(id) {
    await api.delete(`/designations/${id}/`);
  },
};

export default designationService;
