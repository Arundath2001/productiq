import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useNavigate, useParams } from "react-router-dom";
import { useVoyageStore } from "../store/useVoyageStore.js";
import { Loader } from "lucide-react";
import { FaTrash } from "react-icons/fa";
import { exportVoyageData } from "../lib/excel.js";
import ConfirmAlert from "../components/ConfirmAlert.jsx";
import images from "../lib/images.js";

const VoyageDetails = () => {
  const { voyageId } = useParams();
  const {
    voyageDetails,
    getVoyageDetails,
    isVoyageDetails,
    exportVoyage,
    deleteVoyageData,
  } = useVoyageStore();

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedDataId, setSelectedDataId] = useState(null);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (voyageId) {
        getVoyageDetails(voyageId)
            .catch(() => {
                setError("Voyage not found or marked as complete.");
                setTimeout(() => navigate("/completed"), 2000);
            });
    }
}, [voyageId, getVoyageDetails, navigate]);

  if (isVoyageDetails) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-15 animate-spin" />
      </div>
    );
  }

  if (!voyageDetails) {
    return <div>Voyage not found or no data available.</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const handleExport = () => {
    setShowExportConfirm(true);
  };

  const confirmExport = async () => {
    await exportVoyage(voyageId);
    exportVoyageData(voyageDetails.uploadedData);
    setShowExportConfirm(false);
    window.location.href = "/completed";
  };

  const handleShowConfirm = (dataId) => {
    setSelectedDataId(dataId);
    setShowConfirm(true);
  };

  const handleDeleteVoyageData = async () => {
    if (selectedDataId) {
      await deleteVoyageData(voyageId, selectedDataId);
      useVoyageStore.setState((state) => ({
        voyageDetails: {
          ...state.voyageDetails,
          uploadedData: state.voyageDetails.uploadedData.filter(
            (data) => data._id !== selectedDataId
          ),
        },
      }));
      setShowConfirm(false);
    }
  };

  const getTotalWeight = () => {
    return voyageDetails.uploadedData.reduce(
      (total, data) => total + (data.weight || 0),
      0
    );
  };

  const filteredData = voyageDetails.uploadedData.filter((data) => {
    const matchesSearch = data.productCode
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const uploadedDate = new Date(data.uploadedDate);
    const isWithinDateRange =
      (!startDate || uploadedDate >= new Date(startDate)) &&
      (!endDate || uploadedDate <= new Date(endDate));

    return matchesSearch && isWithinDateRange;
  });

  return (
    <div>
      <PageHeader
        mainHead={`${voyageDetails.voyageName}/ VNo ${voyageDetails.voyageNumber}`}
        subText={`${filteredData.length} Products`}
        onExport={handleExport}
        weight={filteredData.length > 0 ? getTotalWeight() : null}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDateFilter={true}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        placeholder='Search by productcode'
      />

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full table-auto border-separate border-spacing-y-2">
          <thead className="bg-white">
            <tr>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                #
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Product Code
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Tracking Number
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Client Company
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Weight
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Sent Date
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Created By
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((data, index) => (
                <tr
                  key={data._id}
                  className="bg-white rounded-xl overflow-hidden"
                >
                  <td className="py-3 px-5 text-sm text-black">{index + 1}</td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.productCode}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.trackingNumber}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.clientCompany}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.weight}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {formatDate(data.uploadedDate)}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.uploadedBy.username}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    <div
                      className="cursor-pointer"
                      onClick={() => handleShowConfirm(data._id)}
                    >
                      <FaTrash color="gray" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="py-3 px-5 text-sm text-center text-black"
                >
                  <div className="flex flex-col items-center justify-center text-center mt-10">
                    <img
                      src={images.file}
                      alt="No Data"
                      className="w-32 h-32 mb-4 opacity-75"
                    />
                    <p className="text-lg font-semibold text-gray-700">
                      No matching products found!
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo="You want to delete this voyage ?"
            handleClose={() => setShowConfirm(false)}
            handleSubmit={handleDeleteVoyageData}
          />
        </div>
      )}
      {showExportConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo="Downloading the Excel file will reset all product quantities in this voyage to zero and move it to Completed Voyages."
            handleClose={() => setShowExportConfirm(false)}
            handleSubmit={confirmExport}
          />
        </div>
      )}
    </div>
  );
};

export default VoyageDetails;
