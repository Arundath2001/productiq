import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useLineStore = create((set, get) => ({
    lines: [],
    lineLoading: false,
    lineError: null,
    isCreating: false,
    isDeleting: false,

    paginationData: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
    },

    getLines: async (branchId) => {
        set({ lineLoading: true, lineError: null })
        try {
            const response = await axiosInstance.get(`/line/${branchId}`);

            const { lines, pagination } = response.data;

            set({
                lines: lines,
                lineError: null,
                lineLoading: false,
                paginationData: pagination
            });

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to fetch lines";

            set({
                lineError: errorMessage,
                lineLoading: false
            });

        }
    },

    createLine: async (lineData) => {

        set({ isCreating: true });

        try {

            const response = await axiosInstance.post('/line/create', lineData);

            if (response.data.success) {
                toast.success(response.data.message || "Line created successfully");
                await get().getLines(lineData.branchId);
            }

            set({ isCreating: false });

            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to create Line";

            set({ lineError: errorMessage, isCreating: false });

            throw error;

        }
    },

    deleteLine: async (lineId) => {
        set({ isDeleting: true })
        try {
            const response = await axiosInstance.delete(`/line/${lineId}`);

            if (response.data.success) {
                toast.success(response.data.message || "Line deleted successfully");
            }

            set({
                lines: get().lines.filter(line => line._id !== lineId),
                isDeleting: false,
                paginationData: {
                    ...get().paginationData,
                    totalItems: get().paginationData.totalItems - 1
                }
            });

            return { success: true, data: response.data };


        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to delete line";

            set({ isDeleting: false, lineError: errorMessage });

            toast.error(errorMessage);

            return { success: false, error: errorMessage };
        }
    }

}));