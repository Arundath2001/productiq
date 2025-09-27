import React, { useEffect, useState } from "react";
import { useBranch } from "../../store/useBranchStore.js";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Loader,
  Pen,
  PencilIcon,
  Plus,
  Trash,
  Trash2Icon,
} from "lucide-react";
import ConfirmAlert from "../../components/ConfirmAlert.jsx";
import AdminForm from "../../components/BranchAdminForm.jsx";

const BranchDetails = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();

  const [deletingAdmin, setDeletingAdmin] = useState(false);

  const [showAdminForm, setShowAdminForm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const {
    currentBranch,
    getBranchById,
    clearCurrentBranch,
    isLoading,
    getBranchAdmin,
    branchAdmin,
    error,
    deleteBranchAdmin,
  } = useBranch();

  useEffect(() => {
    if (branchId) {
      getBranchById(branchId);
    }

    return () => {
      clearCurrentBranch();
    };
  }, [branchId]);

  useEffect(() => {
    if (currentBranch?.branchName) {
      getBranchAdmin(branchId);
    }
  }, [currentBranch]);

  console.log(branchId);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);

    const options = {
      timeZone: "Asia/Dubai",
    };

    const dubaiDate = new Date(date.toLocaleString("en-US", options));

    const day = String(dubaiDate.getDate()).padStart(2, "0");
    const month = String(dubaiDate.getMonth() + 1).padStart(2, "0");
    const year = dubaiDate.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const handleBackClick = () => {
    navigate("/dashboard/branches");
  };

  const handleEditAdmin = (admin) => {};

  const handleDeleteAdmin = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteConfirm(true);
  };

  const handleDeleteClose = () => {
    setShowDeleteConfirm(false);
    setAdminToDelete(null);
  };

  const handleShowAdminForm = () => {
    setShowAdminForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (adminToDelete) {
      try {
        setDeletingAdmin(true);
        await deleteBranchAdmin(adminToDelete._id);
        getBranchAdmin(branchId);
        setShowDeleteConfirm(false);
        setAdminToDelete(null);
      } catch (error) {
        console.error("Error deleting admin:", error);
      } finally {
        setDeletingAdmin(false);
      }
    }
  };

  if (isLoading && !currentBranch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[#B9B9B969] bg-opacity-50 flex items-center justify-center z-50">
          <ConfirmAlert
            alertInfo={`Do you want to delete administrator "${adminToDelete?.username}"? This action cannot be undone.`}
            handleClose={handleDeleteClose}
            handleSubmit={handleDeleteConfirm}
          />
        </div>
      )}

      <div className="flex gap-2.5 items-center mb-3">
        <ChevronLeft
          className="cursor-pointer hover:text-gray-600"
          onClick={handleBackClick}
        />
        <p className="text-lg font-semibold">
          {currentBranch?.branchName} Branch Details
        </p>
      </div>
      <div className="p-4 items-center rounded-sm shadow-sm bg-white mb-3.5">
        <p className="text-black font-semibold mb-3.5 text-center">
          Branch Information
        </p>
        <div className="flex justify-between w-full">
          <div>
            <p className="text-gray-700 text-sm">Branch Name</p>
            <p className="text-black text-sm font-semibold">
              {currentBranch?.branchName}
            </p>
          </div>
          <div>
            <p className="text-gray-700 text-sm">Created By</p>
            <p className="text-black text-sm font-semibold">
              {currentBranch?.createdBy?.username}
            </p>
          </div>
          <div>
            <p className="text-gray-700 text-sm">Created Date</p>
            <p className="text-black text-sm font-semibold">
              {formatDate(currentBranch?.createdAt)}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-sm shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex justify-between">
            <p className="text-sm font-semibold">Branch Administrators</p>
          </div>
          <div
            className="flex gap-1 items-center cursor-pointer"
            onClick={handleShowAdminForm}
          >
            <Plus className="text-blue-500 size-5" />
            <p className="text-blue-500 text-sm">Add New Administrator</p>
          </div>
        </div>
        <table className="w-full border-collapse mt-2.5">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm">Role</th>
              <th className="px-4 py-2 text-left text-sm">Admin Name</th>
              <th className="px-4 py-2 text-left text-sm">Created Date</th>
              <th className="px-4 py-2 text-left text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {branchAdmin && branchAdmin.length > 0 ? (
              branchAdmin.map((admin, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border-b px-4 py-1 border-gray-300 font-medium">
                    {admin.adminRoles && admin.adminRoles.length > 0
                      ? admin.adminRoles.join(", ")
                      : "Null"}
                  </td>
                  <td className="border-b px-4 py-1 border-gray-300 text-sm">
                    {admin.username}
                  </td>
                  <td className="border-b px-4 py-1 border-gray-300 text-sm">
                    {formatDate(admin.createdAt)}
                  </td>
                  <td className="border-b px-4 py-1 border-gray-300 text-sm">
                    <button
                      className="text-gray-600 mr-2 hover:text-gray-400 cursor-pointer"
                      onClick={() => handleEditAdmin(admin)}
                    >
                      <PencilIcon className="size-5" />
                    </button>
                    <button
                      className="text-red-700 hover:text-red-500 cursor-pointer disabled:opacity-50"
                      onClick={() => handleDeleteAdmin(admin)}
                      disabled={deletingAdmin}
                    >
                      {deletingAdmin && adminToDelete?._id === admin._id ? (
                        <Loader className="size-5 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader className="size-4 animate-spin mr-2" />
                      Loading administrators...
                    </div>
                  ) : (
                    "No administrators found for this branch"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showAdminForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <AdminForm
            setShowAdminForm={setShowAdminForm}
            branchName={currentBranch?.branchName}
            branchId={branchId}
          />
        </div>
      )}
    </div>
  );
};

export default BranchDetails;
