import {create} from "zustand";
import {axiosInstance} from "../lib/axios.js"
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIng: false,
    isUpdatingProfile: false,
    usersData:{
        employees:[],
        clients:[]
    },
    

    isCheckingAuth: true,

    checkAuth: async() => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({authUser : res.data })
            
        } catch (error) {
            set({authUser: null})
            console.log("Error in checkAuth", error);
            
        }finally{
            set({isCheckingAuth: false})
        }
    },

    login: async(data) => {
        set({ isLoggingIng : true })
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Login successfully");
        } catch (error) {
            toast.error(error.response.data.message);
        }finally{
            set({ isLoggingIng: false })
        }
    },

    logout: async() => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully")
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    getUsersData: async() => {
        try {
            const res = await axiosInstance.get("/auth/usersdata");
            set({ usersData: res.data });
            toast.success('Users data fetched successfully')
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch users data");
            console.log("Error in getUsersData", error);
        }
    },
    createUser: async (userData) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/register", userData);
            
            await useAuthStore.getState().getUsersData();
    
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create user");
            console.log("Error in createUser", error);
        } finally {
            set({ isSigningUp: false });
        }
    },
    

    deleteUser: async (userId, role) => {
        try {
            await axiosInstance.delete(`/auth/delete/${userId}`)

            set((state) => ({
                usersData: {
                    ...state.usersData,
                    employees: role === "employee"
                        ? state.usersData.employees.filter(user => user._id !== userId)
                        : state.usersData.employees,
                    clients: role === "client"
                        ? state.usersData.clients.filter(user => user._id !== userId)
                        : state.usersData.clients,
                }
            }));

            toast.success("User deleted successfully");

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user");
            console.log("Error in deleteUser", error);
        }
    },
    
    editUser: async (userId, updatedData) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put(`/auth/edit/${userId}`, updatedData);
    
            set((state) => ({
                usersData: {
                    ...state.usersData,
                    employees: updatedData.role === "employee"
                        ? state.usersData.employees.map(user => 
                            user._id === userId ? { ...user, ...res.data.user } : user)
                        : state.usersData.employees,
                    clients: updatedData.role === "client"
                        ? state.usersData.clients.map(user => 
                            user._id === userId ? { ...user, ...res.data.user } : user)
                        : state.usersData.clients,
                },
            }));
    
            toast.success("User updated successfully");
            return res.data.user;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update user");
            console.log("Error in editUser", error);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    
}))