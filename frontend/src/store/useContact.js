import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";

export const useContactStore = create((set) => ({
    contactData: {},
    isSubmitting: false,
    error: null,
    successMessage: null,

    // Submit contact form
    submitContact: async (contactData) => {
        set({ isSubmitting: true, error: null, successMessage: null });
        try {
            const response = await axiosInstance.post("/contact", contactData);
            set({ 
                contactData: response.data,
                isSubmitting: false,
                successMessage: response.data.message || "Message sent successfully!"
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to send message. Please try again.";
            set({ 
                error: errorMessage,
                isSubmitting: false 
            });
            console.error("Error submitting contact form:", error);
            throw error;
        }
    },

    // Clear messages (success/error)
    clearMessages: () => {
        set({ error: null, successMessage: null });
    },

    // Reset contact data
    resetContactData: () => {
        set({ 
            contactData: {},
            error: null,
            successMessage: null,
            isSubmitting: false
        });
    },
}));