import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";


export const useProductCodeStore = create((set, get) => ({
    savedProductCodes: [],
    issavedProduct: false,

    getProductCodes : async () => {
        set({ issavedProduct: true });
        try {
            const res = await axiosInstance.get('/savedcode');

            set({ savedProductCodes: res.data });           
            
            toast.success('Product codes fetched successfully')

        } catch (error) {
            toast.error(error.response?.data?.message || 'Error fetching Product codes' );
        }finally{
            set({ issavedProduct: false })
        }
    }
}))