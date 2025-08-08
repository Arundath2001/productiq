import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useVoyageStore } from "../store/useVoyageStore.js";
import CreateVoyage from "../components/CreateVoyage.jsx";
import { useNavigate } from "react-router-dom";
import { FaCalendarCheck, FaExclamationCircle, FaTrash } from "react-icons/fa";
import ConfirmAlert from "../components/ConfirmAlert.jsx";
import images from "../lib/images.js";
import VoyageStatusForm from "../components/VoyageStatusForm.jsx";
import { useAuthStore } from "../store/useAuthStore.js";

const CompletedVoyages = () => {
  const {
    completedVoyages,
    getCompletedVoyages,
    deleteVoyage,
    updateCompletedVyageStatus,
  } = useVoyageStore();

  const { authUser } = useAuthStore();

  const [showCreateVoyage, setShowCreateVoyage] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showVoyageForm, setShowVoyageForm] = useState(false);
  const [selectedVoyageData, setSelectedVoyageData] = useState(null);
  const [selectedVoyageId, setSelectedVoyageId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    getCompletedVoyages(authUser.branchId);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleViewClick = (voyageId) => {
    navigate(`/dashboard/completed/${voyageId}/companies`);
  };

  const handleShowConfirm = (voyageId) => {
    setSelectedVoyageId(voyageId);
    setShowConfirm(true);
  };

  const handleShowForm = (voyageId) => {
    const voyage = completedVoyages.find((v) => v._id === voyageId);

    if (voyage) {
      setSelectedVoyageData(voyage);
    }
    setShowVoyageForm(true);
  };

  const handleVoyageUpdate = async (updateData) => {
    try {
      await updateCompletedVyageStatus({
        updatedData: updateData,
        voyageId: selectedVoyageData._id,
      });

      setShowVoyageForm(false);

      await getCompletedVoyages(authUser.branchId);

      setSelectedVoyageData(null);
    } catch (error) {
      console.error("Failed to update voyage:", error);
    }
  };

  const handleDeleteVoyage = async () => {
    if (selectedVoyageId) {
      await deleteVoyage(selectedVoyageId);

      useVoyageStore.setState((state) => ({
        completedVoyages: state.completedVoyages.filter(
          (voyage) => voyage._id !== selectedVoyageId
        ),
      }));

      setShowConfirm(false);
    }
  };

  const filteredVoyages = completedVoyages.filter((voyage) => {
    const matchesSearch = voyage.voyageName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const voyageDate = new Date(voyage.createdAt);
    const isWithinDateRange =
      (!startDate || voyageDate >= new Date(startDate)) &&
      (!endDate || voyageDate <= new Date(endDate));

    return matchesSearch && isWithinDateRange;
  });

  return (
    <div>
      <PageHeader
        mainHead="Completed Voyages"
        subText={`${completedVoyages.length} voyages`}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDateFilter={true}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        placeholder="Search by voyage name..."
      />

      <div className="mt-10">
        {filteredVoyages.length > 0 ? (
          <div>
            {filteredVoyages.map((voyage, index) => (
              <div
                key={index}
                className="flex rounded-xl items-center shadow-sm justify-between bg-white px-4 py-2.5 mb-2.5"
              >
                <div className="flex-col">
                  <p className="text-black text-sm font-medium">
                    {voyage.voyageName} | VNo {voyage.voyageNumber}/
                    {voyage.year}
                  </p>
                  <div className="flex items-center mt-1 space-x-3">
                    <div className="flex items-center">
                      <p className="text-xs text-gray-500 mr-1">
                        Expected Date :
                      </p>
                      <p className="text-xs text-blue-400 bg-blue-100 px-2 py-0.5 rounded-md">
                        {formatDate(voyage.expectedDate)}
                      </p>
                    </div>

                    {voyage.delayMessage && (
                      <div className="border-r-2 border-gray-400 h-4" />
                    )}

                    {voyage.delayMessage && (
                      <div className="flex items-center">
                        <p className="text-xs text-gray-500 mr-1">
                          Delay Message :
                        </p>
                        <p className="text-xs text-orange-400 bg-orange-100 px-2 py-0.5 rounded-md">
                          {voyage.delayMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <p className="text-xs text-gray-600">
                    Created Date: {formatDate(voyage.createdAt)}
                  </p>

                  <div
                    onClick={() => handleViewClick(voyage._id)}
                    className="rounded-xl border px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    View
                  </div>

                  <div
                    className="cursor-pointer"
                    onClick={() => handleShowForm(voyage._id)}
                  >
                    <FaCalendarCheck color="gray" />
                  </div>

                  <div
                    className="cursor-pointer"
                    onClick={() => handleShowConfirm(voyage._id)}
                  >
                    <FaTrash color="gray" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center mt-10">
            <img
              src={images.file}
              alt="No Voyages"
              className="w-32 h-32 mb-4 opacity-75"
            />
            <p className="text-lg font-semibold text-gray-700">
              No completed voyages found!
            </p>
            <p className="text-sm text-gray-500">Try to export a new voyage.</p>
          </div>
        )}
      </div>

      {showVoyageForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <VoyageStatusForm
            voyageName={selectedVoyageData.voyageName}
            expectedDate={selectedVoyageData.expectedDate}
            delayMessage={selectedVoyageData.delayMessage}
            onClose={() => setShowVoyageForm(false)}
            onUpdate={handleVoyageUpdate}
          />
        </div>
      )}

      {showCreateVoyage && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
            <CreateVoyage setShowCreateVoyage={setShowCreateVoyage} />
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo="You want to delete this voyage?"
            handleClose={() => setShowConfirm(false)}
            handleSubmit={handleDeleteVoyage}
          />
        </div>
      )}
    </div>
  );
};

export default CompletedVoyages;
