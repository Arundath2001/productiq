import React, { useEffect, useState } from "react";
import ConfirmAlert from "./ConfirmAlert";
import { useGoni } from "../store/useGoniStore";
import {
  ArrowRightCircle,
  ChevronRight,
  Loader,
  PackageX,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Tooltip from "./Tooltip";
import CreatePackageForm from "./CreatePackageForm";
import { useAuthStore } from "../store/useAuthStore";

const CreatePackages = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedGoni, setSelectedGoni] = useState(null);
  const { goniDetails, isLoading, error, getGonies, deleteGoni } = useGoni();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getGonies(authUser.branchId);
  }, [authUser]);

  const handleDeleteGoni = (goni) => {
    setSelectedGoni(goni);
    setShowDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedGoni) {
      try {
        await deleteGoni({
          goniId: selectedGoni._id,
          branchId: authUser.branchId,
        });

        setShowDelete(false);
        setSelectedGoni(null);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mt-5">
        {goniDetails && goniDetails.length > 0 ? (
          goniDetails.map((goni) => (
            <div
              key={goni._id}
              className="flex items-center rounded-xl bg-white shadow-sm px-4 py-2 mb-2.5 justify-between cursor-pointer  hover:shadow-gray-400"
            >
              <div className="">
                <p className="font-medium">{goni.goniName}</p>
                <div className="mt-1 flex items-center">
                  <span className="text-xs text-gray-500 mr-1">Company : </span>{" "}
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-1 py-0.5 rounded-md">
                    {goni.companyId.companyCode}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Tooltip text="Edit Package">
                  <Pencil
                    size={20}
                    className="text-gray-500 hover:text-blue-500 cursor-pointer"
                  />
                </Tooltip>
                <Tooltip text="Delete Package">
                  <Trash2
                    size={20}
                    className="text-gray-500 hover:text-red-500 cursor-pointer"
                    onClick={() => handleDeleteGoni(goni)}
                  />
                </Tooltip>
                {/* <Tooltip text="View Package">
                  <ChevronRight
                    size={20}
                    className="text-black cursor-pointer"
                  />
                </Tooltip> */}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col min-h-[70vh] justify-center items-center">
            <PackageX size={64} className="text-gray-400 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700">
              No Packages Found
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              You haven’t created any packages yet. Click below to get started.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 cursor-pointer bg-black text-white px-4 py-2 rounded-lg shadow hover:bg-gray-800 transition-all duration-200"
            >
              <Plus className="text-white" size={20} />
              Create Package
            </button>
          </div>
        )}
      </div>
      <button
        onClick={() => setShowCreateForm(true)}
        className="fixed right-10 bottom-10 bg-black text-white p-3 rounded-full cursor-pointer hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 z-40"
      >
        <Plus size={24} />
      </button>

      {showCreateForm && (
        <div className="fixed flex inset-0 items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <CreatePackageForm setShowCreateForm={setShowCreateForm} />
        </div>
      )}

      {showDelete && selectedGoni && (
        <div className="fixed flex inset-0 items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo={`Do you want to delete ${selectedGoni.goniName}?`}
            handleClose={() => setShowDelete(false)}
            handleSubmit={handleConfirmDelete}
          />
        </div>
      )}
    </div>
  );
};

export default CreatePackages;
