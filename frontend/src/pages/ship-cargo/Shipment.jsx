import React, { useEffect, useState } from "react";
import { Eye, Hammer, Loader, Ship, Trash2 } from "lucide-react";
import { useSeaVoyageStore } from "../../store/useSeaVoyageStore";
import { useAuthStore } from "../../store/useAuthStore";
import PageHeader from "../../components/PageHeader";
import CreateVoyage from "../../components/CreateVoyage";
import ConfirmAlert from "../../components/ConfirmAlert";
import { useNavigate } from "react-router-dom";

const Shipment = () => {
  const { authUser } = useAuthStore();
  const {
    getSeaVoyages,
    seaVoyages,
    seaVoyageError,
    paginationData,
    seaVoyageLoadMore,
    seaVoyageLoading,
    createSeaVoyage,
    deleteSeaVoyage,
    isCreating,
    isDeleting,
  } = useSeaVoyageStore();

  const navigate = useNavigate();

  const [showCreateSeaVoyage, setShowCreateSeaVoyage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeaVoyageId, setSelectedSeaVoyageId] = useState(null);
  const [selectedSeaVoyageNum, setSelectedSeaVoyageNum] = useState(null);

  const status = "pending";

  useEffect(() => {
    getSeaVoyages(authUser.branchId, status, false, 1, searchQuery);
  }, [authUser.branchId, searchQuery]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleCreateSeaVoyage = () => {
    setShowCreateSeaVoyage(true);
  };

  const handleShowDeleteConfirm = (seaVoyageId, seaVoyageNumber) => {
    setShowDeleteConfirm(true);
    setSelectedSeaVoyageId(seaVoyageId);
    setSelectedSeaVoyageNum(seaVoyageNumber);
  };

  const handleDeleteSeaVoyage = async () => {
    try {
      if (selectedSeaVoyageId) {
        const result = await deleteSeaVoyage(selectedSeaVoyageId);

        if (result.success) {
          setShowDeleteConfirm(false);
        }
      }
    } catch (error) {}
  };

  const handleViewClick = (seaVoageId) => {
    navigate(`/dashboard/sea-voyage/${seaVoageId}/container`);
  };

  const renderContent = () => {
    if (seaVoyageLoading && seaVoyages.length === 0) {
      return (
        <div className="flex justify-center items-center h-[90vh]">
          <Loader className="size-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="mt-4">
        {seaVoyages.map((voyage) => (
          <div
            key={voyage._id}
            className="bg-white p-4 rounded-xl shadow-sm hover:shadow-gray-500 flex justify-between items-center px-4 py-2.5 mb-2.5"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Ship className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {voyage.seaVoyageName}
                </p>
                <p className="text-xs text-gray-500">
                  Sea voyage No: {voyage.seaVoyageNumber}
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <p className="text-[12px] text-gray-500">
                Created Date : {formatDate(voyage.createdAt)}
              </p>

              <div
                onClick={() => handleViewClick(voyage._id)}
                className="flex text-sm items-center gap-1.5 rounded-xl border px-2 py-1.5 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 cursor-pointer"
              >
                <Eye size={16} />
                <span>View</span>
              </div>

              <div
                onClick={() =>
                  handleShowDeleteConfirm(voyage._id, voyage.seaVoyageNumber)
                }
              >
                <Trash2
                  size={16}
                  className="text-gray-500 hover:text-red-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        mainHead="Created sea-voyages"
        subText={`${paginationData.totalItems} voyages`}
        onCreate={handleCreateSeaVoyage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {renderContent()}

      {showCreateSeaVoyage && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
            <CreateVoyage
              setShowCreateVoyage={setShowCreateSeaVoyage}
              onCreateVoyage={createSeaVoyage}
              isCreating={isCreating}
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo={`Do you want to delete sea voyage ${selectedSeaVoyageNum} ?`}
            handleClose={() => setShowDeleteConfirm(false)}
            handleSubmit={handleDeleteSeaVoyage}
            isDeleting={isDeleting}
          />
        </div>
      )}
    </div>
  );
};

export default Shipment;
