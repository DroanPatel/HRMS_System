import api from "./api";
import { unwrapList } from "../utils/pagination";

const notificationService = {
  async getNotifications() {
    const response = await api.get("/notifications/");
    return unwrapList(response.data);
  },
  async markAsRead(id) {
    const response = await api.post(`/notifications/${id}/read/`);
    return response.data;
  },
  async markAllAsRead() {
    const response = await api.post("/notifications/read-all/");
    return response.data;
  },
};

export default notificationService;
