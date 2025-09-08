import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useGoni = create((set, get) => ({
    goniDetails: [],
    isLoading: true,
    error: null,

    getGonies: async (branchId) => {

        set({ isLoading: true });

        try {
            const response = await axiosInstance.get(`/goni/${branchId}/goni-details`);

            set({
                goniDetails: response.data.gonies,
                isLoading: false,
                error: null
            });

        } catch (error) {

            const errorMessage = error.response?.data?.message || 'Failed to fetch gonies';

            set({
                goniDetails: [],
                isLoading: false,
                error: errorMessage
            });

            toast(errorMessage);
            throw error;

        }
    },

    createGoni: async (goniData) => {

        set({ isLoading: true })

        try {

            const response = await axiosInstance.post('/goni/create', goniData);

            await get().getGonies(goniData.branchId);

            set({
                isLoading: false,
                error: null
            });

            toast.success(response.data.message || 'Goni created successfully');
            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create goni';

            set({
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
            throw error;
        }
    },

    deleteGoni: async ({ goniId, branchId }) => {
        set({ isLoading: true });

        try {
            const response = await axiosInstance.delete(`/goni/${goniId}/delete`);

            await get().getGonies(branchId);

            set({
                isLoading: false,
                error: null
            })

            toast.success(response.data.message || "");

        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete goni';

            set({
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
            throw error;

        }

    }

}));