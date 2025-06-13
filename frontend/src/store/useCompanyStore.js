import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";

export const useCompanyStore = create((set, get) => ({
    companies: [],
    selectedCompany: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
    successMessage: null,

    // Create new company
    createCompany: async (companyData) => {
        set({ isSubmitting: true, error: null, successMessage: null });
        try {
            const response = await axiosInstance.post("companycode/companies", companyData);
            const newCompany = response.data.data;
            
            set((state) => ({
                companies: [newCompany, ...state.companies],
                isSubmitting: false,
                successMessage: response.data.message || "Company created successfully!"
            }));
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to create company. Please try again.";
            set({
                error: errorMessage,
                isSubmitting: false
            });
            console.error("Error creating company:", error);
            throw error;
        }
    },

    // Get all companies
    getAllCompanies: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("companycode/companies");
            set({
                companies: response.data.data,
                isLoading: false
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to fetch companies.";
            set({
                error: errorMessage,
                isLoading: false
            });
            console.error("Error fetching companies:", error);
            throw error;
        }
    },

    // Update company
    updateCompany: async (id, companyData) => {
        set({ isSubmitting: true, error: null, successMessage: null });
        
        // Validate ID before making request
        if (!id || id === 'undefined' || id === undefined) {
            const errorMessage = "Invalid company ID";
            set({
                error: errorMessage,
                isSubmitting: false
            });
            console.error("Invalid company ID:", id);
            throw new Error(errorMessage);
        }
        
        console.log("Updating company with ID:", id, "Data:", companyData);
        
        try {
            const response = await axiosInstance.put(`companycode/companies/${id}`, companyData);
            const updatedCompany = response.data.data;
            
            set((state) => ({
                companies: state.companies.map(company => 
                    company.id === id ? updatedCompany : company
                ),
                selectedCompany: state.selectedCompany?.id === id ? updatedCompany : state.selectedCompany,
                isSubmitting: false,
                successMessage: response.data.message || "Company updated successfully!"
            }));
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to update company. Please try again.";
            set({
                error: errorMessage,
                isSubmitting: false
            });
            console.error("Error updating company:", error);
            throw error;
        }
    },

    // Delete company
    deleteCompany: async (id) => {
        set({ isSubmitting: true, error: null, successMessage: null });
        
        // Validate ID before making request
        if (!id || id === 'undefined' || id === undefined) {
            const errorMessage = "Invalid company ID";
            set({
                error: errorMessage,
                isSubmitting: false
            });
            console.error("Invalid company ID:", id);
            throw new Error(errorMessage);
        }
        
        try {
            const response = await axiosInstance.delete(`companycode/companies/${id}`);
            
            set((state) => ({
                companies: state.companies.filter(company => company.id !== id),
                selectedCompany: state.selectedCompany?.id === id ? null : state.selectedCompany,
                isSubmitting: false,
                successMessage: response.data.message || "Company deleted successfully!"
            }));
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to delete company. Please try again.";
            set({
                error: errorMessage,
                isSubmitting: false
            });
            console.error("Error deleting company:", error);
            throw error;
        }
    },

    // Set selected company
    setSelectedCompany: (company) => {
        set({ selectedCompany: company });
    },

    // Get company by ID (from local state first, then API if not found)
    getCompanyById: async (id) => {
        const { companies } = get();
        const existingCompany = companies.find(company => company.id === id);
        
        if (existingCompany) {
            set({ selectedCompany: existingCompany });
            return existingCompany;
        }

        // If not in local state, fetch from API
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get(`companycode/companies/${id}`);
            const company = response.data.data;
            set({
                selectedCompany: company,
                isLoading: false
            });
            return company;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to fetch company.";
            set({
                error: errorMessage,
                isLoading: false
            });
            console.error("Error fetching company:", error);
            throw error;
        }
    },

    // Clear messages (success/error)
    clearMessages: () => {
        set({ error: null, successMessage: null });
    },

    // Reset store
    resetStore: () => {
        set({
            companies: [],
            selectedCompany: null,
            isLoading: false,
            isSubmitting: false,
            error: null,
            successMessage: null
        });
    },

    // Check if company code exists (utility function)
    checkCompanyExists: (companyCode) => {
        const { companies } = get();
        return companies.some(company => 
            company.companyCode.toUpperCase() === companyCode.toUpperCase()
        );
    },
}));