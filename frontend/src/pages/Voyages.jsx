import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useVoyageStore } from "../store/useVoyageStore.js";
import CreateVoyage from "../components/CreateVoyage.jsx";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import ConfirmAlert from "../components/ConfirmAlert.jsx";
import images from "../lib/images.js";
import { useAuthStore } from "../store/useAuthStore.js";

const Voyages = () => {
  const { isVoyagesLoading, voyages, getVoyages, deleteVoyage } =
    useVoyageStore();

  const { authUser } = useAuthStore();

  console.log(authUser.branchId);

  const [showCreateVoyage, setShowCreateVoyage] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const [selectedVoyageId, setSelectedVoyageId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (authUser && authUser.branchId) {
      console.log("Fetching voyages for branchId:", authUser.branchId);
      getVoyages(authUser.branchId);
    }
  }, [authUser, authUser?.branchId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleViewClick = (voyageId) => {
    navigate(`/dashboard/voyage/${voyageId}/companies`);
  };

  const handleCreateVoyage = () => {
    setShowCreateVoyage(true);
  };

  const handleShowConfirm = (voyageId) => {
    setSelectedVoyageId(voyageId);
    setShowConfirm(true);
  };

  const handleDeleteVoyage = async () => {
    console.log(selectedVoyageId);

    if (selectedVoyageId) {
      await deleteVoyage(selectedVoyageId);
      setShowConfirm(false);
    }
  };

  const filteredVoyages = voyages.filter((voyage) => {
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
        mainHead="Created Voyages"
        subText={`${voyages.length} voyages`}
        onCreate={handleCreateVoyage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDateFilter={true}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        placeholder="Search by voyage name..."
      />

      <div className="mt-4">
        {filteredVoyages.length > 0 ? (
          <div>
            {filteredVoyages.map((voyage, index) => (
              <div
                key={index}
                className="flex rounded-xl items-center shadow-sm justify-between bg-white px-4 py-2.5 mb-2.5"
              >
                <p className="text-black text-sm">
                  {voyage.voyageName} | VNo {voyage.voyageNumber}/{voyage.year}
                </p>

                <div className="flex gap-3 items-center">
                  <p>Created Date: {formatDate(voyage.createdAt)}</p>

                  <div
                    onClick={() => handleViewClick(voyage._id)}
                    className="rounded-xl border px-2.5 py-1.5 cursor-pointer"
                  >
                    View
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
              No active voyages found!
            </p>
            <p className="text-sm text-gray-500">Try to create a new voyage.</p>
          </div>
        )}
      </div>
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
            alertInfo="You want to delete this voyage ?"
            handleClose={() => setShowConfirm(false)}
            handleSubmit={handleDeleteVoyage}
          />
        </div>
      )}
    </div>
  );
};

export default Voyages;
