import {create} from "zustand";
import {axiosInstance} from "../lib/axios.js"
import toast from "react-hot-toast";
import{ io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIng: false,
    isUpdatingProfile: false,
    isApprovingClient: false,
    isRejectingClient: false,
    isResubmittingClient: false,
    usersData:{
        employees:[],
        clients:[]
    },
    pendingClients: [],
    approvedClients: [],
    rejectedClients: [],
    socket: null,
    

    isCheckingAuth: true,

    checkAuth: async() => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({authUser : res.data })

            get().connectSocket();
            
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
            get().connectSocket();
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
            get().disconnectSocket();
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

    // Client Approval Functions
    approveClient: async (userId, approvalData) => {
        set({ isApprovingClient: true });
        try {
            const res = await axiosInstance.put(`/auth/approve-client/${userId}`, approvalData);
            
            // Update local state - remove from pending, add to approved
            set((state) => ({
                pendingClients: state.pendingClients.filter(client => client._id !== userId),
                approvedClients: [...state.approvedClients, res.data.user],
                usersData: {
                    ...state.usersData,
                    clients: state.usersData.clients.map(client => 
                        client._id === userId ? { ...client, ...res.data.user } : client
                    )
                }
            }));

            toast.success("Client approved successfully");
            return res.data.user;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to approve client");
            console.log("Error in approveClient", error);
        } finally {
            set({ isApprovingClient: false });
        }
    },

    rejectClient: async (userId, rejectionData) => {
        set({ isRejectingClient: true });
        try {
            const res = await axiosInstance.put(`/auth/reject-client/${userId}`, rejectionData);
            
            // Update local state - remove from pending, add to rejected
            set((state) => ({
                pendingClients: state.pendingClients.filter(client => client._id !== userId),
                rejectedClients: [...state.rejectedClients, res.data.user],
                usersData: {
                    ...state.usersData,
                    clients: state.usersData.clients.map(client => 
                        client._id === userId ? { ...client, ...res.data.user } : client
                    )
                }
            }));

            toast.success("Client rejected successfully");
            return res.data.user;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject client");
            console.log("Error in rejectClient", error);
        } finally {
            set({ isRejectingClient: false });
        }
    },

    getPendingClients: async () => {
        try {
            const res = await axiosInstance.get("/auth/pending-clients");
            set({ pendingClients: res.data.clients });
            return res.data.clients;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch pending clients");
            console.log("Error in getPendingClients", error);
        }
    },

    getClientsByStatus: async (status) => {
        try {
            const res = await axiosInstance.get(`/auth/clients/${status}`);
            
            // Update the appropriate state based on status
            if (status === 'pending') {
                set({ pendingClients: res.data.clients });
            } else if (status === 'approved') {
                set({ approvedClients: res.data.clients });
            } else if (status === 'rejected') {
                set({ rejectedClients: res.data.clients });
            }
            
            return res.data.clients;
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to fetch ${status} clients`);
            console.log("Error in getClientsByStatus", error);
        }
    },

    resubmitRejectedClient: async (userId) => {
        set({ isResubmittingClient: true });
        try {
            const res = await axiosInstance.put(`/auth/resubmit-client/${userId}`);
            
            // Update local state - remove from rejected, add to pending
            set((state) => ({
                rejectedClients: state.rejectedClients.filter(client => client._id !== userId),
                pendingClients: [...state.pendingClients, res.data.user],
                usersData: {
                    ...state.usersData,
                    clients: state.usersData.clients.map(client => 
                        client._id === userId ? { ...client, ...res.data.user } : client
                    )
                }
            }));

            toast.success("Client resubmitted for approval successfully");
            return res.data.user;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resubmit client");
            console.log("Error in resubmitRejectedClient", error);
        } finally {
            set({ isResubmittingClient: false });
        }
    },

    // Helper function to refresh all client data
    refreshAllClientData: async () => {
        try {
            await Promise.all([
                get().getPendingClients(),
                get().getClientsByStatus('approved'),
                get().getClientsByStatus('rejected'),
                get().getUsersData()
            ]);
        } catch (error) {
            console.log("Error refreshing client data", error);
        }
    },

    connectSocket : async () => {
        const { authUser } = get();
        if(!authUser || get().socket?.connected) return;
        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            }
        } )
        socket.connect();

        set({ socket: socket });
    },

    disconnectSocket : async () => {
        if(get().socket?.connected) get().socket.disconnect();
    }
    
}))