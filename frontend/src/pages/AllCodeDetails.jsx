import React, { useEffect, useState } from "react";
import { useVoyageStore } from "../store/useVoyageStore.js";
import { useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { FaEdit, FaEllipsisV, FaPlus, FaTrash } from "react-icons/fa";
import ConfirmAlert from "../components/ConfirmAlert.jsx";

const AllCodeDetails = () => {
  const { getProductByCode, productByCode, deleteVoyageData } =
    useVoyageStore();
  const { productCode } = useParams();

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedDataId, setSelectedDataId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (productCode) {
      getProductByCode(productCode);
    }
  }, [productCode, getProductByCode]);

  const handlePopUpToggle = (index) => {
    setShowPopUp(showPopUp === index ? null : index);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getTotalWeight = () => {
  const total = productByCode.reduce(
    (total, data) => total + (data.weight || 0), 
    0
  );
  return Math.round(total * 100) / 100; 
};

  const handleShowConfirm = (voyageId) => {
    setSelectedDataId(voyageId);
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

  const filteredProductCode = productByCode.filter((product) => {
    const matchesSearch = product.productCode
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const productDate = new Date(product.uploadedDate);
    const isWithinDateRange =
      (!startDate || productDate >= new Date(startDate)) &&
      (!endDate || productDate <= new Date(endDate));

    return matchesSearch && isWithinDateRange;
  });

  return (
    <div>
      <PageHeader
        mainHead={productCode}
        subText={`${productByCode.length} Products`}
        weight={filteredProductCode.length > 0 ?getTotalWeight() : null}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDateFilter={true}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        placeholder='Search by product code'
      />

      <div className="mt-5">
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full table-auto border-separate border-spacing-y-2">
            <thead className="bg-white">
              <tr>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  #
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  PRODUCT CODE
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  TRACKING NUMBER
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  SENDED CLIENT COMPANY
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  WEIGHT
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  SENDED DATE
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  CREATED BY
                </th>
                {/* <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 "></th> */}
              </tr>
            </thead>
            <tbody>
              {filteredProductCode && filteredProductCode.length > 0 ? (
                filteredProductCode.map((data, index) => (
                  <tr
                    key={data._id}
                    className="bg-white rounded-xl overflow-hidden"
                  >
                    <td className="py-3 px-5 text-sm text-black ">
                      {index + 1}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.productCode}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.trackingNumber}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.clientCompany}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.weight}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {formatDate(data.uploadedDate)}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.uploadedBy.username}
                    </td>
                    {/* <td className="py-3 px-5 text-sm text-black relative">
                      <div
                        className="cursor-pointer"
                        onClick={() => handleShowConfirm(data._id)}
                      >
                        <FaTrash color="gray" />
                      </div>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-3 px-5 text-sm text-center text-black"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default AllCodeDetails;
