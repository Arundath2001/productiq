import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useTrackProduct = create((set, get) => ({
    productDetails: null,
    isLoading: false,
    error: null,
    trackingNumber: "",

    trackProduct: async (trackingNumber) => {
        const trackingNum = trackingNumber;

        set({ isLoading: true, error: null });

        try {
            const response = await axiosInstance.post('/trackproduct', {
                trackingNumber: trackingNum
            });

            set({
                productDetails: response.data.productDetails,
                isLoading: false,
                error: null
            });

            toast.success(response.data.message);
        } catch (error) {
            const errorMessage = error.response.data.message;
            set({
                productDetails: null,
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
            throw error;
        }
    },

    resetTracking: () => {
        set({
            productDetails: null,
            isLoading: false,
            error: null,
            trackingNumber: ""
        })
    },

    clearProductDetails: () => {
        set({
            productDetails: null,
            error: null
        })
    }
}));