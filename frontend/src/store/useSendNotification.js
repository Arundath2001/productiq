import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";

export const useSendNotification = create((set) => ({
  isLoading: false,
  error: null,

  sendNotification: async (notificationData) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await axiosInstance.post("/notification/sendNoti", {
        message: notificationData.message,
        title: notificationData.title || "Aswaq Forwarder",
        sendPushNotification: notificationData.sendPushNotification !== false
      });
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error("Error sending notification:", error);
      set({ isLoading: false, error: error.response?.data?.message || error.message });
      throw error;
    }
  },
  
  clearError: () => set({ error: null })
}));