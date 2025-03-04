import React, { useEffect, useState } from "react";
import { useBillStore } from "../store/useBillStore";
import PageHeader from "../components/PageHeader";
import { FaFilePdf, FaTimes, FaTrash, FaPlus } from "react-icons/fa";
import BillofLading from "./BillofLading";
import BillOfLadingPDF from "./test";
import ConfirmAlert from "../components/ConfirmAlert";

const AllBills = () => {
  const { bills, getAllBills, deleteBill } = useBillStore();
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBill, setPreviewBill] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getAllBills();
  }, []);

  const handleEditClick = (bill) => {
    setSelectedBill(bill);
    setShowBillForm(true);
  };

  const handleShowForm = () => {
    setSelectedBill(null);
    setShowBillForm(true);
  };

  const handleCloseForm = () => {
    setShowBillForm(false);
    setSelectedBill(null);
    getAllBills();
  };

  const handlePreviewOpen = (bill) => {
    setPreviewBill(bill);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewBill(null);
  };

  const handleDeleteConfirm = (id) => {
    setBillToDelete(id);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      await deleteBill(billToDelete);
      getAllBills();
    } catch (error) {
      console.error("Error deleting bill:", error);
    } finally {
      setConfirmDelete(false);
      setBillToDelete(null);
    }
  };

  const filteredBills = bills.filter((bill) =>
    bill.billNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <PageHeader
        mainHead="Created Bills"
        subText={`${bills.length} Bills`}
        title="All Bills of Lading"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDateFilter={false}
        placeholder='Search by BL Number'
      />

      <div className="mt-4">
      {filteredBills.length > 0 ? (
          filteredBills.map((bill, index) => (
            <div
              key={index}
              className={`flex rounded-xl items-center justify-between bg-white px-4 py-2.5 mb-2.5 shadow-md
                ${
                  !bill.draft
                    ? "border-l-5 border-green-400"
                    : "border-l-5 border-yellow-400"
                }
            `}
            >
              <p className="text-black text-sm">Bill No: {bill.billNo}</p>

              <div className="flex gap-3 items-center">
                <p className="text-gray-500 text-sm">
                  Created Date:{" "}
                  {new Date(bill.createdAt).toLocaleDateString("en-GB")}
                </p>

                <div
                  onClick={() => handleEditClick(bill)}
                  className="rounded-xl border px-2.5 py-1.5 cursor-pointer"
                >
                  Edit
                </div>

                <div
                  className="cursor-pointer"
                  onClick={() => handlePreviewOpen(bill)}
                >
                  <FaFilePdf color="green" />
                </div>

                <div
                  className="cursor-pointer"
                  onClick={() => handleDeleteConfirm(bill._id)}
                >
                  <FaTrash color="gray" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-4 text-gray-500">No Bills Found</div>
        )}
      </div>
      <div
        onClick={handleShowForm}
        className="bg-black p-3 bottom-10 right-10 rounded-full fixed cursor-pointer"
      >
        <FaPlus size={25} color="#FFFFFF" />
      </div>

      {(showBillForm || isPreviewOpen) && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg min-w-8/12 max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-0 right-2"
              onClick={showBillForm ? handleCloseForm : handleClosePreview}
            >
              <FaTimes size={25} color="black" className="cursor-pointer" />
            </button>
            {showBillForm ? (
              <BillofLading bill={selectedBill} onClose={handleCloseForm} />
            ) : (
              <BillOfLadingPDF billData={previewBill} />
            )}
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo="Are you sure you want to delete this BL?"
            handleSubmit={handleDelete}
            handleClose={() => setConfirmDelete(false)}
          />
        </div>
      )}
    </div>
  );
};

export default AllBills;
