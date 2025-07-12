import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useCompanyStore } from "../store/useCompanyStore";
import PageHeader from "../components/PageHeader";
import UserForm from "../components/UserForm.jsx";
import { FaPen, FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import ConfirmAlert from "../components/ConfirmAlert.jsx";

const ClientInfo = () => {
  const {
    getUsersData,
    usersData,
    deleteUser,
    approveClient,
    rejectClient,
    isApprovingClient,
    isRejectingClient,
  } = useAuthStore();
  const { companies, getAllCompanies } = useCompanyStore();

  const [showUSerForm, setShowUserForm] = useState(false);
  const [showPopUp, setShowPopUp] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [approvingUser, setApprovingUser] = useState(null);
  const [selectedCustomerCode, setSelectedCustomerCode] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState("");

  // New states for searchable dropdown
  const [customerCodeSearch, setCustomerCodeSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Predefined rejection reasons
  const predefinedReasons = [
    "Incomplete documentation provided",
    "Invalid contact information",
    "Business registration not verified",
    "Duplicate account detected",
    "Does not meet eligibility criteria",
    "Suspicious activity detected",
    "Missing required licenses",
    "Custom reason", // This will allow users to write their own
  ];

  useEffect(() => {
    getUsersData();
    getAllCompanies();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleShowForm = (user = null, changePassword = false) => {
    setSelectedUser(user ? { ...user, changePassword } : null);
    setShowUserForm(true);
  };

  const handleConfirm = (userId) => {
    setSelectedUserId(userId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedUserId) {
      await deleteUser(selectedUserId, "client");
      setShowConfirm(false);
      setSelectedUserId(null);
    }
  };

  const handleApproveClick = (user) => {
    setApprovingUser(user);
    setSelectedCustomerCode(user.companyCode || "");
    setCustomerCodeSearch(user.companyCode || ""); // Pre-fill search with existing code
    setApprovalNotes("");
    setShowDropdown(false);
  };

  const handleApproveSubmit = async () => {
    if (!selectedCustomerCode) return;

    try {
      await approveClient(approvingUser._id, {
        companyCode: selectedCustomerCode,
        approvalNotes: approvalNotes.trim() || undefined,
      });
      setApprovingUser(null);
      setCustomerCodeSearch("");
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to approve client:", error);
    }
  };

  const handleRejectClick = (user) => {
    setRejectingUser(user);
    setRejectionMessage("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectionMessage.trim()) return;

    try {
      await rejectClient(rejectingUser._id, {
        rejectionMessage: rejectionMessage.trim(),
      });
      setRejectingUser(null);
    } catch (error) {
      console.error("Failed to reject client:", error);
    }
  };

  const handlePredefinedReasonSelect = (reason) => {
    if (reason === "Custom reason") {
      setRejectionMessage(""); // Clear for custom input
    } else {
      setRejectionMessage(reason);
    }
  };

  // Filter companies based on search
  const filteredCompanies = companies.filter((company) =>
    company.companyCode.toLowerCase().includes(customerCodeSearch.toLowerCase())
  );

  const handleCustomerCodeSelect = (companyCode) => {
    setSelectedCustomerCode(companyCode);
    setCustomerCodeSearch(companyCode);
    setShowDropdown(false);
  };

  const handleCustomerCodeSearchChange = (e) => {
    const value = e.target.value;
    setCustomerCodeSearch(value);
    setSelectedCustomerCode(value);
    setShowDropdown(true);
  };

  const getApprovalStatusBadge = (user) => {
    if (user.approvalStatus === "approved") {
      return (
        <span className="text-green-600 text-xs font-medium">Approved</span>
      );
    } else if (user.approvalStatus === "rejected") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-xs font-medium">Rejected</span>
          {user.rejectionMessage && (
            <span
              className="text-gray-500 text-xs cursor-help"
              title={`Rejection reason: ${user.rejectionMessage}`}
            >
              ℹ️
            </span>
          )}
        </div>
      );
    } else {
      return (
        <span className="text-yellow-600 text-xs font-medium">Pending</span>
      );
    }
  };

  const filteredClient = usersData?.clients
    ? usersData.clients.filter((client) =>
        client.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div>
      <PageHeader
        mainHead="Client List"
        subText={`${filteredClient.length} Clients`}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDateFilter={false}
        placeholder="Search by client username"
      />

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full table-auto border-separate border-spacing-y-2">
          <thead className="bg-white">
            <tr>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                #
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                CLIENT USERNAME
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                CUSTOMER CODE
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                CONTACT DETAILS
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                STATUS
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                CREATED AT
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                APPROVED/REJECTED BY
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClient && filteredClient.length > 0 ? (
              filteredClient.map((data, index) => (
                <tr
                  key={data._id}
                  className="bg-white rounded-xl overflow-hidden"
                >
                  <td className="py-3 px-5 text-sm text-black">{index + 1}</td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.username}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.companyCode || "-"}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {data.countryCode} {data.phoneNumber}
                      </span>
                      <span className="text-gray-600 text-xs break-all">
                        {data.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {getApprovalStatusBadge(data)}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {formatDate(data.createdAt)}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.approvedBy?.username ||
                      data.rejectedBy?.username ||
                      "-"}
                  </td>
                  <td className="py-3 px-5 text-sm text-black relative">
                    <div className="flex gap-3.5">
                      {data.approvalStatus === "pending" ? (
                        <>
                          <button
                            onClick={() => handleApproveClick(data)}
                            className="text-green-600 font-medium hover:text-green-800 transition-colors"
                            disabled={isApprovingClient}
                          >
                            {isApprovingClient ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleRejectClick(data)}
                            className="text-red-600 font-medium hover:text-red-800 transition-colors"
                            disabled={isRejectingClient}
                          >
                            {isRejectingClient ? "Rejecting..." : "Reject"}
                          </button>
                        </>
                      ) : data.approvalStatus === "approved" ? (
                        <>
                          <button
                            onClick={() => handleRejectClick(data)}
                            className="text-red-600 font-medium hover:text-red-800 transition-colors"
                            disabled={isRejectingClient}
                          >
                            {isRejectingClient ? "Rejecting..." : "Reject"}
                          </button>
                          <FaTrash
                            className="cursor-pointer hover:text-red-600 transition-colors ml-2"
                            color="gray"
                            onClick={() => handleConfirm(data._id)}
                          />
                          <FaPen
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            color="gray"
                            onClick={() => handleShowForm(data)}
                          />
                        </>
                      ) : data.approvalStatus === "rejected" ? (
                        <>
                          <button
                            onClick={() => handleApproveClick(data)}
                            className="text-green-600 font-medium hover:text-green-800 transition-colors"
                            disabled={isApprovingClient}
                          >
                            {isApprovingClient
                              ? "Re-approving..."
                              : "Re-approve"}
                          </button>
                          <FaTrash
                            className="cursor-pointer hover:text-red-600 transition-colors ml-2"
                            color="gray"
                            onClick={() => handleConfirm(data._id)}
                          />
                        </>
                      ) : null}
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
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        onClick={() => handleShowForm()}
        className="bg-black p-3 bottom-10 right-10 rounded-full fixed cursor-pointer"
      >
        <FaPlus size={25} color="#FFFFFF" />
      </div>

      {showUSerForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <UserForm
            formTitile="ENTER CLIENT DETAILS"
            role="client"
            closeForm={setShowUserForm}
            userData={selectedUser}
          />
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo="You want to delete this user ?"
            handleClose={() => setShowConfirm(false)}
            handleSubmit={confirmDelete}
          />
        </div>
      )}

      {/* Approval Modal */}
      {approvingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#00000066] z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {approvingUser.approvalStatus === "rejected"
                ? "Re-approve"
                : "Approve"}{" "}
              {approvingUser.username}
            </h2>

            {approvingUser.approvalStatus === "rejected" &&
              approvingUser.rejectionMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    <strong>Previous rejection reason:</strong>{" "}
                    {approvingUser.rejectionMessage}
                  </p>
                </div>
              )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Code *
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2 pr-8"
                  placeholder="Search or select customer code..."
                  value={customerCodeSearch}
                  onChange={handleCustomerCodeSearchChange}
                  onFocus={() => setShowDropdown(true)}
                />
                <svg
                  className="absolute right-2 top-3 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>

                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company) => (
                        <div
                          key={company.id}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() =>
                            handleCustomerCodeSelect(company.companyCode)
                          }
                        >
                          {company.companyCode}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No customer codes found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Notes (Optional)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 h-20 resize-none"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {approvalNotes.length}/200 characters
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setApprovingUser(null);
                  setCustomerCodeSearch("");
                  setShowDropdown(false);
                }}
                disabled={isApprovingClient}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={!selectedCustomerCode || isApprovingClient}
                onClick={handleApproveSubmit}
              >
                {isApprovingClient
                  ? "Approving..."
                  : approvingUser.approvalStatus === "rejected"
                  ? "Re-approve"
                  : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#00000066] z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Reject {rejectingUser.username}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select Reason
              </label>
              <div className="grid grid-cols-1 gap-2 mb-3">
                {predefinedReasons.map((reason, index) => (
                  <button
                    key={index}
                    type="button"
                    className="text-left p-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                    onClick={() => handlePredefinedReasonSelect(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 h-24 resize-none"
                placeholder="Please provide a reason for rejection or select from above..."
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {rejectionMessage.length}/500 characters
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                onClick={() => setRejectingUser(null)}
                disabled={isRejectingClient}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={!rejectionMessage.trim() || isRejectingClient}
                onClick={handleRejectSubmit}
              >
                {isRejectingClient ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientInfo;
