import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore.js";

export const useVoyageStore = create((set, get) => ({
    voyages: [],
    allVoyagesByBranch: [],
    isVoyagesLoading: false,
    isCreateVoyage: false,
    voyageDetails: null,
    isVoyageDetails: false,
    productByCode: [],
    completedVoyages: [],
    companiesSummary: null,
    isCompaniesSummaryLoading: false,
    companyDetails: null,
    isCompanyDetailsLoading: false,
    completedCompaniesSummary: null,
    isCompletedCompaniesSummaryLoading: false,
    completedCompanyDetails: null,
    isCompletedCompanyDetailsLoading: false,

    getVoyages: async (branchId) => {
        set({ isVoyagesLoading: true });

        try {
            const res = await axiosInstance.get(`/voyage/voyages/${branchId}`);

            set({ voyages: res.data });

        } catch (error) {
            console.error("Error fetching voyages", error.message);
            toast.error("Failed to fetch voyages");
        } finally {
            set({ isVoyagesLoading: false });
        }
    },


    getCompletedVoyages: async (branchId) => {
        set({ isVoyagesLoading: true });

        try {
            const res = await axiosInstance.get(`/voyage/completed-voyages/${branchId}`);

            set({ completedVoyages: res.data });

            console.log("Completed Voyages:", res.data);

        } catch (error) {
            console.error("Error fetching completed voyages", error.message);
            toast.error("Failed to fetch completed voyages");
        } finally {
            set({ isVoyagesLoading: false });
        }
    },


    createVoyage: async (data) => {
        set({ isCreateVoyage: true });

        try {
            const res = await axiosInstance.post("/voyage/create", data);

            set((state) => ({
                voyages: [...state.voyages, res.data],
            }));

            toast.success("Voyage created successfully!");

        } catch (error) {
            console.error("Error creating voyage", error);

            const errorMessage = error.response?.data?.message || "Failed to create voyage";

            toast.error(errorMessage);
        } finally {
            set({ isCreateVoyage: false });
        }
    },

    getVoyageDetails: async (voyageId) => {
        set({ isVoyageDetails: true })
        try {
            const res = await axiosInstance.get(`/voyage/${voyageId}`)

            set({ voyageDetails: res.data });

        } catch (error) {
            console.log("error fetching voyage details", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch voyage details");
        } finally {
            set({ isVoyageDetails: false })
        }
    },

    getProductByCode: async (productCode) => {
        try {
            const res = await axiosInstance.get(`/voyage/getproducts/${productCode}`);

            if (res.data.length === 0) {
                toast("No data found for this code", { icon: "ℹ️" });
            }

            set({ productByCode: res.data });

        } catch (error) {
            console.error("Error fetching product details:", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch product details");

            set({ productByCode: [] });
        }
    },

    getCompaniesSummaryByVoyage: async (voyageId) => {
        set({ isCompaniesSummaryLoading: true });

        try {
            const res = await axiosInstance.get(`/voyage/${voyageId}/companies`);

            set({ companiesSummary: res.data });

            if (res.data.companies.length === 0) {
                toast("No pending companies found for this voyage", { icon: "ℹ️" });
            }

        } catch (error) {
            console.error("Error fetching companies summary:", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch companies summary");
            set({ companiesSummary: null });
        } finally {
            set({ isCompaniesSummaryLoading: false });
        }
    },

    getCompanyDetailsByVoyage: async (voyageId, companyCode) => {
        set({ isCompanyDetailsLoading: true });

        try {
            const res = await axiosInstance.get(`/voyage/${voyageId}/companies/${companyCode}?status=pending`);

            set({ companyDetails: res.data });

            if (res.data.items.length === 0) {
                toast("No pending items found for this company", { icon: "ℹ️" });
            }

        } catch (error) {
            console.error("Error fetching company details:", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch company details");
            set({ companyDetails: null });
        } finally {
            set({ isCompanyDetailsLoading: false });
        }
    },

    getCompletedCompaniesSummaryByVoyage: async (voyageId) => {
        set({ isCompletedCompaniesSummaryLoading: true });

        try {
            const res = await axiosInstance.get(`/voyage/${voyageId}/completed-companies`);

            set({ completedCompaniesSummary: res.data });

            if (res.data.companies.length === 0) {
                toast("No completed companies found for this voyage", { icon: "ℹ️" });
            }

        } catch (error) {
            console.error("Error fetching completed companies summary:", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch completed companies summary");
            set({ completedCompaniesSummary: null });
        } finally {
            set({ isCompletedCompaniesSummaryLoading: false });
        }
    },

    getCompletedCompanyDetailsByVoyage: async (voyageId, companyCode) => {
        set({ isCompletedCompanyDetailsLoading: true });

        try {
            const res = await axiosInstance.get(`/voyage/${voyageId}/completed-companies/${companyCode}`);

            set({ completedCompanyDetails: res.data });

            if (res.data.items.length === 0) {
                toast("No completed items found for this company", { icon: "ℹ️" });
            }

        } catch (error) {
            console.error("Error fetching completed company details:", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch completed company details");
            set({ completedCompanyDetails: null });
        } finally {
            set({ isCompletedCompanyDetailsLoading: false });
        }
    },

    getAllPendingVoyageProducts: async (voyageId) => {
        try {
            const res = await axiosInstance.get(`/voyage/${voyageId}/all-products?status=pending`);
            return res.data.products;
        } catch (error) {
            console.error("Error fetching pending voyage products:", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch pending voyage products");
            throw error;
        }
    },

    getAllCompletedVoyageProducts: async (voyageId) => {
        try {
            const res = await axiosInstance.get(`/voyage/${voyageId}/all-products?status=completed`);
            return res.data.products;
        } catch (error) {
            console.error("Error fetching completed voyage products:", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch completed voyage products");
            throw error;
        }
    },


    exportVoyage: async (voyageId) => {
        try {
            await axiosInstance.put(`/voyage/export/${voyageId}`);

            toast.success("Voyage data exported successfully!");

        } catch (error) {
            console.error("Error exporting voyage", error.message);
            toast.error(error.response?.data?.message || "Failed to export voyage");
        }
    },

    closeVoyage: async (voyageId, destinationDate) => {
        try {

            await axiosInstance.put(`/voyage/close/${voyageId}`, {
                destinationDate: destinationDate
            });

            const formattedDate = new Date(destinationDate).toLocaleDateString();

            set((state) => ({
                voyages: state.voyages.map((voyage) =>
                    voyage._id === voyageId ? {
                        ...voyage,
                        status: "completed",
                        completedDate: new Date().toISOString(),
                        destinationDate: destinationDate
                    } : voyage
                ),
                voyageStatus: "completed",
                // Update companies summary if it exists
                companiesSummary: state.companiesSummary && state.companiesSummary.voyageInfo?._id === voyageId
                    ? {
                        ...state.companiesSummary,
                        voyageInfo: {
                            ...state.companiesSummary.voyageInfo,
                            status: "completed",
                            destinationDate: destinationDate
                        }
                    }
                    : state.companiesSummary
            }));

            toast.success(`Voyage closed successfully! Estimated ${destinationDate} days to destination. Notifications sent to clients.`);
        } catch (error) {
            console.error("Error closing voyage", error.message);
            toast.error(error.response?.data?.message || "Failed to close voyage");
        }
    },

    deleteVoyage: async (voyageId) => {
        try {
            await axiosInstance.delete(`/voyage/${voyageId}`);

            set((state) => ({
                voyages: state.voyages.filter((voyage) => voyage._id !== voyageId),
            }));

            toast.success("Voyage deleted successfully!");

        } catch (error) {
            console.error("Error deleting voyage", error.message);
            toast.error(error.response?.data?.message || "Failed to delete voyage");
        }
    },

    deleteVoyageData: async (voyageId, dataId) => {
        try {
            await axiosInstance.delete(`/voyage/${voyageId}/data/${dataId}`);

            // Update the companyDetails in the store to remove the deleted item
            set((state) => ({
                companyDetails: state.companyDetails ? {
                    ...state.companyDetails,
                    items: state.companyDetails.items.filter((data) => data._id !== dataId),
                } : null,
            }));

            toast.success("Voyage data deleted successfully!");

        } catch (error) {
            console.error("Error deleting voyage data", error.message);
            toast.error(error.response?.data?.message || "Failed to delete voyage data");
        }
    },

    updateCompletedVyageStatus: async ({ updatedData, voyageId }) => {
        try {

            const response = await axiosInstance.put(`/voyage/completed-voyage/update/${voyageId}`, { updatedData });

            const successMessage = response.data?.message || "Voyage updated successfully!";
            toast.success(successMessage);


        } catch (error) {

            const errorMessage = error.response?.data?.message || "Failed to update voyage";
            toast.error(errorMessage);
            throw error;

        }
    },

    getAllVoyagesByBranch: async (branchId) => {
        set({ isVoyagesLoading: true });
        try {
            const response = await axiosInstance.get(`voyage/${branchId}/get-all-voyage`);

            set({ allVoyagesByBranch: response.data, isVoyagesLoading: false, error: null })

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to get voyage details";
            toast.error(errorMessage);
            throw error;
        }
    }

}))