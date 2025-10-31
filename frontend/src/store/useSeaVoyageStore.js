import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useSeaVoyageStore = create((set, get) => ({
    seaVoyages: [],
    seaVoyageLoading: false,
    seaVoyageError: null,
    seaVoyageLoadMore: false,
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

    getSeaVoyages: async (branchId, status, loadMore = false, page = 1, search = "") => {
        if (loadMore) {
            set({ seaVoyageLoadMore: true });
        } else {
            set({ seaVoyageLoading: true, seaVoyageError: null });
        }
        try {
            const response = await axiosInstance.get(`/sea-voyage/${branchId}/?status=${status}&page=${page}&search=${search}`);

            const { seaVoyages, pagination } = response.data;

            set({
                seaVoyages: loadMore ? [...get().seaVoyages, ...seaVoyages] : seaVoyages,
                seaVoyageLoadMore: false,
                seaVoyageLoading: false,
                seaVoyageError: null,
                paginationData: pagination,
            });


        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to fetch sea voyages";

            set({
                seaVoyageError: errorMessage,
                seaVoyageLoadMore: false,
                seaVoyageLoading: false
            })

        }
    },

    createSeaVoyage: async (voyageData) => {
        set({ isCreating: true, seaVoyageError: null });
        try {
            const seaVoyageData = {
                seaVoyageName: voyageData.voyageName,
                seaVoyageNumber: voyageData.voyageNumber,
                branchId: voyageData.branchId,
                lineId: voyageData.lineId,
                year: voyageData.year
            }

            const response = await axiosInstance.post('/sea-voyage/create', seaVoyageData);

            if (response.data.success) {
                toast.success(response.data.message || "Sea voyage created successfully");

                await get().getSeaVoyages(voyageData.branchId, "pending");
            }

            set({ isCreating: false });

            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to create sea voyage";

            set({ isCreating: false, seaVoyageError: errorMessage });

            toast.error(errorMessage);

            throw error;

        }
    },

    deleteSeaVoyage: async (seaVoyageId) => {

        set({ isDeleting: true, seaVoyageError: null });

        try {

            const response = await axiosInstance.delete(`/sea-voyage/delete/${seaVoyageId}`);

            if (response.data.success) {
                toast.success(response.data.message || "Sea voyage deleted successfully");
            }

            set({
                seaVoyages: get().seaVoyages.filter(voyage => voyage._id !== seaVoyageId),
                isDeleting: false,
                paginationData: {
                    ...get().paginationData,
                    totalItems: get().paginationData.totalItems - 1
                }
            });

            return { success: true, data: response.data };

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to delete sea voyage";

            set({ isDeleting: false, seaVoyageError: errorMessage });

            toast.error(errorMessage);

            return { success: false, error: errorMessage };
        }
    }

}));