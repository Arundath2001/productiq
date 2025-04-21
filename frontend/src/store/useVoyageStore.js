import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore.js";

export const useVoyageStore = create((set, get) => ({
    voyages : [],
    isVoyagesLoading : false,
    isCreateVoyage : false,
    voyageDetails: null,
    isVoyageDetails: false,
    productByCode: [],
    completedVoyages: [],

    getVoyages: async () => {
        set({ isVoyagesLoading: true });
    
        try {
            const res = await axiosInstance.get("/voyage/voyages");
    
            set({ voyages: res.data });
    
            if (res.data.length === 0) {
                toast("No active voyage found", { icon: "⚠️" });
            } else {
                toast.success("Voyages fetched successfully");
            }
    
        } catch (error) {
            console.error("Error fetching voyages", error.message);
            toast.error("Failed to fetch voyages");
        } finally {
            set({ isVoyagesLoading: false });
        }
    },
    

    getCompletedVoyages: async () => {
        set({ isVoyagesLoading: true });
    
        try {
            const res = await axiosInstance.get("/voyage/completed-voyages");
    
            set({ completedVoyages: res.data });
    
            if (res.data.length === 0) {
                toast("No completed voyages available", { icon: "ℹ️" });
            } else {
                toast.success("Completed voyages fetched successfully");
            }
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

    getVoyageDetails: async(voyageId) => {
        set({ isVoyageDetails: true })
        try {
            const res = await axiosInstance.get(`/voyage/${voyageId}`)

            set({ voyageDetails: res.data });

            toast.success("Voyage  details fetched  successfully");

        } catch (error) {
            console.log("error fetching voyage details", error.message);
            toast.error(error.response?.data?.message || "Failed to fetch voyage details");
        }finally{
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
    

    exportVoyage: async (voyageId) => {
        try {
            await axiosInstance.put(`/voyage/export/${voyageId}`);

            set((state) => ({
                voyages: state.voyages.map((voyage) =>
                    voyage._id === voyageId ? { ...voyage, status: "completed" } : voyage
                ),
                voyageStatus: "completed",
            }));

            toast.success("Voyage exported successfully!");

        } catch (error) {
            console.error("Error exporting voyage", error.message);
            toast.error(error.response?.data?.message || "Failed to export voyage");
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
    
            set((state) => ({
                voyages: state.voyages.map((voyage) =>
                    voyage._id === voyageId
                        ? {
                            ...voyage,
                            uploadedData: voyage.uploadedData.filter((data) => data._id !== dataId),
                        }
                        : voyage
                ),
            }));
    
            toast.success("Voyage data deleted successfully!");
    
        } catch (error) {
            console.error("Error deleting voyage data", error.message);
            toast.error(error.response?.data?.message || "Failed to delete voyage data");
        }
    }
    
    
}) )