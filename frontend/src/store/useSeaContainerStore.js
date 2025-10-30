import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useSeaContainerStore = create((set, get) => ({

    seaContainers: [],
    seaContainerLoading: false,
    seaContainerError: null,
    isDeleting: false,
    isCreating: false,

    paginationData: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
    },

    getSeaContainers: async (branchId, seaVoyageId, page = 1, status, search = "") => {

        set({ seaContainerLoading: true, seaContainerError: null })

        try {

            const response = await axiosInstance.get(`/sea-container/${branchId}/sea-voyage/${seaVoyageId}`);

            const { seaContainers, pagination } = response.data;

            set({
                seaContainers: seaContainers,
                seaContainerLoading: false,
                seaContainerError: null
            });

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to fetch containers";

            set({
                seaContainerLoading: false,
                seaContainerError: errorMessage
            });

        }
    },

    createSeaContainer: async (containerData) => {
        set({ isCreating: true });
        try {
            const response = await axiosInstance.post('/sea-container/create', containerData);

            if (response.data.success) {
                toast.success(response.data.message || "Sea-container created successfully!");
                await get().getSeaContainers(containerData.branchId, containerData.seaVoyageId);
            }

            set({ isCreating: false });

            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to create container";
            set({ isCreating: false });

            toast.error(errorMessage);

            throw error;
        }
    },

    deleteSeaContainer: async (containerId) => {

        set({ isDeleting: true });

        try {

            const response = await axiosInstance.delete(`/sea-container/${containerId}`);

            if (response.data.success) {
                toast.success(response.data.message || "Container deleted successfully");
            }

            set({
                seaContainers: get().seaContainers.filter(container => container._id !== containerId),
                isDeleting: false,
                paginationData: {
                    ...get().paginationData,
                    totalItems: get().paginationData.totalItems - 1
                }
            });

            return { success: true }

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to delete container";

            set({ isDeleting: false, seaContainerError: errorMessage });

            toast.error(errorMessage);

            return { success: false, error: errorMessage };
        }
    }

}));