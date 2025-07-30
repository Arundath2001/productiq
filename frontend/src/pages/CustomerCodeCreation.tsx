import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/useCompanyStore.js';
import { Trash2, Edit, Plus, X, Check, AlertCircle, Pen } from 'lucide-react';
import PageHead from "../components/PageHeader";
import InputLine from "../components/InputLine";
import SolidButton from "../components/SolidButton";
import ConfirmAlert from "../components/ConfirmAlert"; // Import the ConfirmAlert component
import toast from "react-hot-toast";

function CustomerCodeCreation() {
  const {
    companies,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    createCompany,
    getAllCompanies,
    updateCompany,
    deleteCompany,
    clearMessages
  } = useCompanyStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  interface Company {
    id: number;
    companyCode: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: {
      username: string;
    };
  }

  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyCode, setCompanyCode] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Load companies on component mount
  useEffect(() => {
    getAllCompanies();
  }, [getAllCompanies]);

  // Show toast notifications for success/error messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      clearMessages();
    }
    if (error) {
      toast.error(error);
      clearMessages();
    }
  }, [error, successMessage, clearMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyCode.trim()) {
      toast.error('Customer code is required');
      return;
    }

    try {
      if (editingCompany) {
        // Debug: Log the company ID before update
        console.log('Editing company:', editingCompany);
        console.log('Company ID:', editingCompany.id);

        if (!editingCompany.id) {
          toast.error('Invalid company ID');
          return;
        }

        await updateCompany(editingCompany.id, { companyCode: companyCode.trim() });
      } else {
        await createCompany({ companyCode: companyCode.trim() });
      }
      handleCloseModal();
    } catch (error) {
      // Error is handled by the store and will trigger toast via useEffect
      console.error('Submit error:', error);
    }
  };

  const handleEdit = (company) => {
    console.log('Edit button clicked for company:', company);

    // Validate company object and ID
    if (!company || !company.id) {
      toast.error('Invalid company data');
      console.error('Invalid company object:', company);
      return;
    }

    setEditingCompany(company);
    setCompanyCode(company.companyCode);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (company) => {
    if (!company || !company.id) {
      toast.error('Invalid company data');
      console.error('Invalid company object for delete:', company);
      return;
    }

    setCompanyToDelete(company);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;

    try {
      console.log('Deleting company with ID:', companyToDelete.id);
      await deleteCompany(companyToDelete.id);
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
    } catch (error) {
      // Error is handled by the store and will trigger toast via useEffect
      console.error('Delete error:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCompanyToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setCompanyCode('');
  };

  const handleChange = (e) => {
    setCompanyCode(e.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <PageHead
        mainHead="Customer Code Management"
        subText={`${companies.length} Customer Codes`}
        placeholder="Search by customer code"
        onCreate={undefined}
        onExport={undefined}
        searchQuery={undefined}
        setSearchQuery={undefined}
        showDateFilter={undefined}
        startDate={undefined}
        setStartDate={undefined}
        endDate={undefined}
        setEndDate={undefined} onCloseVoyage={undefined} />

      {/* Company List */}
      <div className="px-4 pb-20">
        {isLoading && (
          <div className="flex flex-col h-screen justify-center items-center text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xl font-semibold opacity-80">Loading companies...</p>
          </div>
        )}

        {!isLoading && companies.length === 0 && (
          <div className="flex flex-col h-screen justify-center items-center text-gray-600">
            <p className="text-xl font-semibold opacity-80">
              No customer codes available
            </p>
          </div>
        )}

        {!isLoading && companies.length > 0 && (
          <div className="mt-5">
            {companies.map((company) => {
              // Debug: Check if company has proper ID
              if (!company.id) {
                console.warn('Company without ID found:', company);
              }

              return (
                <div
                  key={company.id || company._id} // Fallback to _id if id is missing
                  className="flex rounded-xl items-center shadow-sm justify-between bg-white px-4 py-2.5 mb-2.5"
                >
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{company.companyCode}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Created: {formatDate(company.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2.5 items-center">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-1">Created By : </span>
                      <span className="text-xs text-gray-500 mr-1">
                        {company.createdBy?.username || 'N/A'}
                      </span>
                    </div>

                    <div
                      onClick={() => handleEdit(company)}
                      className="cursor-pointer"
                    >
                      <Pen size={15} className="text-gray-500 hover:text-blue-500 transition-colors duration-200" />
                    </div>

                    <div onClick={() => handleDeleteClick(company)} className="cursor-pointer">
                      <Trash2
                        className="text-gray-500 hover:text-red-500 transition-colors duration-200"
                        size={15}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Create Button - Bottom Right */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-10 bg-black p-3 rounded-full cursor-pointer hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-40"
      >
        <Plus size={24} />
      </button>

      {/* Modal - Updated to match UserForm design */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#B9B9B969] bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white px-5 py-4 rounded-xl w-96">
            <h1 className="text-center mb-4">
              {editingCompany ? 'Edit Customer Code' : 'Create New Customer Code'}
            </h1>

            <div className="h-0.5 bg-black mb-4"></div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <InputLine
                name="companyCode"
                label="Customer Code *"
                placeholder="Enter customer code"
                value={companyCode}
                onChange={handleChange}
              />

              <div className="flex gap-2.5 justify-center mt-7">
                <SolidButton
                  buttonName="Cancel"
                  variant="outlined"
                  onClick={handleCloseModal}
                />
                <SolidButton
                  buttonName={isSubmitting ? (editingCompany ? 'Updating...' : 'Creating...') : (editingCompany ? 'Update' : 'Create')}
                  type="submit"
                  onClick={!companyCode.trim() || isSubmitting ? undefined : undefined}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[#B9B9B969] bg-opacity-50 flex items-center justify-center z-50">
          <ConfirmAlert
            alertInfo={`Do you want to delete the customer code "${companyToDelete?.companyCode}"?`}
            handleClose={handleDeleteCancel}
            handleSubmit={handleDeleteConfirm}
          />
        </div>
      )}
    </div>
  );
}

export default CustomerCodeCreation;