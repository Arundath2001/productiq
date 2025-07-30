import React, { useEffect, useState } from "react";
import PageHead from "../components/PageHeader";
import { useProductCodeStore } from "../store/useProductCodeStore.js";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ConfirmAlert from "../components/ConfirmAlert.jsx";

const AllProductQr = () => {
  const {
    savedProductCodes,
    issavedProduct,
    getProductCodes,
    deleteProductCode,
  } = useProductCodeStore();

  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [productCodeId, setProductCodeId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    getProductCodes();
  }, [getProductCodes]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleViewClick = (productCode) => {
    navigate(`/voyages/getproducts/${productCode}`);
  };

  const handleShowConfirm = (codeId) => {
    setProductCodeId(codeId);
    setShowConfirm(true);
  };

  const handleDeleteProduct = async () => {
    console.log(productCodeId);

    if (productCodeId) {
      await deleteProductCode(productCodeId);
      setShowConfirm(false);
    }
  };

  return (
    <div>
      <PageHead
        mainHead="All Product QR"
        subText={`${savedProductCodes.length} Saved Codes`}
        placeholder="Search by product code"
      />

      <div className="mt-5">
        {savedProductCodes && savedProductCodes.length > 0 ? (
          savedProductCodes.map((savedCode, index) => (
            <div
              key={index}
              className="flex rounded-xl items-center shadow-sm justify-between bg-white px-4 py-2.5 mb-2.5"
            >
              <div className="flex flex-col">
                <p className="text-sm font-medium">{savedCode.productCode}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500 mr-1">Company : </span>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {savedCode.companyCode}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                <p className="text-xs text-gray-600">
                  Created: {formatDate(savedCode.createdAt)}
                </p>

                <div
                  onClick={() => handleViewClick(savedCode.productCode)}
                  className="rounded-xl border px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 text-sm focus:outline-none"
                >
                  View
                </div>

                <div
                  onClick={() => handleShowConfirm(savedCode._id)}
                  className="group"
                >
                  <FaTrash
                    className="cursor-pointer text-gray-500 group-hover:text-red-500 transition-colors duration-200"
                    size={15}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col h-screen justify-center items-center text-gray-600">
            <p className="text-xl font-semibold opacity-80">
              No saved codes available
            </p>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo="You want to delete this code ?"
            handleClose={() => setShowConfirm(false)}
            handleSubmit={handleDeleteProduct}
          />
        </div>
      )}
    </div>
  );
};

export default AllProductQr;
