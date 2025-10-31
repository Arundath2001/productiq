import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useContainerCompanyStore = create((set, get) => ({
    containerCompanies: [],
    containerCompanyLoading: false,
    containerCompanyError: null,
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

    getContainerCompanies: async (branchId, lineId) => {
        set({ containerCompanyLoading: true, containerCompanyError: null });

        try {
            const response = await axiosInstance.get(`/container-company/${branchId}/line/${lineId}`);

            const { containerCompanies, pagination } = response.data;

            set({
                containerCompanies: containerCompanies,
                containerCompanyError: null,
                containerCompanyLoading: false,
                paginationData: pagination
            });


        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to fetch container-companies";

            set({
                containerCompanyError: errorMessage,
                containerCompanyLoading: false
            });

        }
    },

    createContainerCompany: async (containerCompanyData) => {

        set({ isCreating: true });

        try {

            const response = await axiosInstance.post('/container-company/create', containerCompanyData);

            if (response.data.success) {
                toast.success(response.data.message || "container-company created successfully");
                await get().getContainerCompanies(containerCompanyData.branchId);
            }

            set({ isCreating: false });

            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to create container-company";

            set({ containerCompanyError: errorMessage, isCreating: false });

            throw error;

        }
    },

    deleteContainerCompany: async (containerId) => {
        set({ isDeleting: true })
        try {
            const response = await axiosInstance.delete(`/container-company/${containerId}`);

            if (response.data.success) {
                toast.success(response.data.message || "container-company deleted successfully");
            }

            set({
                containerCompanies: get().containerCompanies.filter(cntrCmpny => cntrCmpny._id !== containerId),
                isDeleting: false,
                paginationData: {
                    ...get().paginationData,
                    totalItems: get().paginationData.totalItems - 1
                }
            });

            return { success: true, data: response.data };


        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to delete container-company";

            set({ isDeleting: false, containerCompanyError: errorMessage });

            toast.error(errorMessage);

            return { success: false, error: errorMessage };
        }
    }

}));