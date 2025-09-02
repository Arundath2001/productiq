import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const usePackage = create((set, get) => ({
    packages: [],
    packageDetails: [],
    isLoadingPackages: false,
    pkgError: null,

    packageDetailsByVoyageAndCompany: async (companyId, voyageId) => {
        set({ isLoadingPackages: true, pkgError: null });

        try {
            const response = await axiosInstance.get(`/package/${companyId}/voyage/${voyageId}`);

            set({
                packages: response.data.packages,
                isLoadingPackages: false
            });


            return response.data;
        } catch (error) {
            set({
                pkgError: error.response?.data?.message || "Error fetching packages",
                isLoadingPackages: false
            });
            throw error;
        }
    },

    getPackageDetails: async (packageId) => {
        set({ isLoadingPackages: true });

        try {
            const response = await axiosInstance.get(`/package/${packageId}/get-package`);

            set({ packageDetails: response.data.package, isLoadingPackages: false, pkgError: null });

            return response.data;
        } catch (error) {
            set({
                pkgError: error.response?.data?.message || "Error fetching packages",
                isLoadingPackages: false
            });
            throw error;
        }
    }
}));