import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";

export const useBillStore = create((set) => ({
    billData: {},
    bills: [],
    editingBill: null,

    saveBill: async (billData) => {
        try {
            let response;
            if (billData._id) {
                response = await axiosInstance.put(`/billoflading/${billData._id}`, billData);
            } else {
                response = await axiosInstance.post("/billoflading", billData);
            }
            set({ billData: response.data });
        } catch (error) {
            console.error("Error saving Bill of Lading:", error);
            throw error;
        }
    },
    

    getAllBills: async () => {
        try {
            const response = await axiosInstance.get("/billoflading");
            set({ bills: response.data });
        } catch (error) {
            console.error("Error fetching Bills of Lading:", error);
            throw error;
        }
    },

    getBillById: async (id) => {
        try {
            const response = await axiosInstance.get(`/billoflading/${id}`);
            set({ billData: response.data });
        } catch (error) {
            console.error("Error fetching Bill of Lading:", error);
            throw error;
        }
    },

    updateBill: async (id, updatedData) => {
        try {
            const response = await axiosInstance.put(`/billoflading/${id}`, updatedData);
            set({ billData: response.data });
            console.log("recieved data in update :", updatedData);
            
        } catch (error) {
            console.error("Error updating Bill of Lading:", error);
            throw error;
        }
    },

    deleteBill: async (id) => {
        try {
            await axiosInstance.delete(`/billoflading/${id}`);
            set((state) => ({
                bills: state.bills.filter((bill) => bill._id !== id),
            }));
        } catch (error) {
            console.error("Error deleting Bill of Lading:", error);
            throw error;
        }
    },
}));
