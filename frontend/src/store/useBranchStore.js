import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useBranch = create((set, get) => ({
    branchDetails: [],
    currentBranch: null,
    isLoading: true,
    error: null,
    branchAdmin: [],

    getBranches: async () => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get('/branch/branches');

            set({
                branchDetails: response.data.branches,
                isLoading: false,
                error: null
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to fetch branches";

            set({
                branchDetails: [],
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
            throw error;
        }
    },

    getBranchAdmin: async (branchId) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/branch/${branchId}/admins`);

            set({
                branchAdmin: response.data.admins,
                isLoading: false,
                error: null
            });

            return response.data.admins;

        } catch (error) {

            const errorMessage = error.response?.data?.message || "Failed to fetch branch admin details";

            set({
                branchAdmin: [],
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
            throw error;

        }
    },

    getBranchById: async (branchId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axiosInstance.get(`/branch/${branchId}`);

            set({
                currentBranch: response.data.branch,
                isLoading: false,
                error: null
            });

            return response.data.branch

        } catch (error) {

            const errorMessage = error.response?.data?.message || "Failed to fetch branch details";

            set({
                currentBranch: null,
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
            throw error;
        }
    },

    createBranchWithAdmins: async (branchData) => {
        const { branchName, admins } = branchData;

        set({ isLoading: true, error: null });

        try {
            const usernames = admins.map(admin => admin.username);
            const existingUsersResponse = await axiosInstance.post('/branch/check-usernames', {
                usernames
            });

            if (existingUsersResponse.data.existingUsernames?.length > 0) {
                const existingNames = existingUsersResponse.data.existingUsernames.join(', ');
                const errorMessage = `Username(s) already exist: ${existingNames}`;

                set({
                    isLoading: false,
                    error: errorMessage
                });

                toast.error(errorMessage);
                throw new Error(errorMessage);
            }

            const response = await axiosInstance.post('/branch/create-with-admins', {
                branchName,
                admins
            });

            const { branch, createdAdmins } = response.data;

            await get().getBranches();

            set({
                isLoading: false,
                error: null
            });

            toast.success(
                `Branch "${branchName}" created successfully with ${createdAdmins.length} administrator${createdAdmins.length > 1 ? 's' : ''}!`,
                { duration: 4000 }
            );

            return { branch, admins: createdAdmins };

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to create branch with admins";

            set({
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage, { duration: 4000 });
            throw error;
        }
    },

    editBranchAdmin: async (adminId, adminData) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axiosInstance.put(`/branch/admin/${adminId}`, adminData);

            const currentBranch = get().currentBranch;
            if (currentBranch?.branchName) {
                await get().getBranchAdmin(currentBranch.branchName);
            }

            set({
                isLoading: false,
                error: null
            });

            toast.success("Administrator updated successfully!");

            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to update administrator";

            set({
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
            throw error;
        }
    },

    deleteBranchAdmin: async (adminId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axiosInstance.delete(`branch/admin/${adminId}`);

            const currentBranch = get().currentBranch;

            if (currentBranch?.branchName) {
                await get().getBranchAdmin(currentBranch.branchName);
            }

            set({
                isLoading: false,
                error: null
            });

            toast.success(response.data.message);

            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to delete administrator";

            set({
                isLoading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
            throw error;
        }
    },

    resetStates: () => {
        set({
            error: null,
            isLoading: false
        });
    },

    clearCurrentBranch: () => {
        set({ currentBranch: null });
    },

    clearError: () => {
        set({ error: null });
    }
}));