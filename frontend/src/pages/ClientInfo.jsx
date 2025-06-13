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
    isRejectingClient 
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
    setSelectedCustomerCode("");
    setApprovalNotes("");
  };

  const handleApproveSubmit = async () => {
    if (!selectedCustomerCode) return;
    
    try {
      await approveClient(approvingUser._id, {
        companyCode: selectedCustomerCode,
        approvalNotes: approvalNotes.trim() || undefined
      });
      setApprovingUser(null);
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
        rejectionMessage: rejectionMessage.trim()
      });
      setRejectingUser(null);
    } catch (error) {
      console.error("Failed to reject client:", error);
    }
  };

  const getApprovalStatusBadge = (user) => {
    if (user.approvalStatus === 'approved') {
      return <span className="text-green-600 text-xs font-medium">Approved</span>;
    } else if (user.approvalStatus === 'rejected') {
      return <span className="text-red-600 text-xs font-medium">Rejected</span>;
    } else {
      return <span className="text-yellow-600 text-xs font-medium">Pending</span>;
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
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">#</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">CLIENT USERNAME</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">CUSTOMER CODE</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">CLIENT LOCATION</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">STATUS</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">CREATED AT</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">CREATED BY</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredClient && filteredClient.length > 0 ? (
              filteredClient.map((data, index) => (
                <tr key={data._id} className="bg-white rounded-xl overflow-hidden">
                  <td className="py-3 px-5 text-sm text-black">{index + 1}</td>
                  <td className="py-3 px-5 text-sm text-black">{data.username}</td>
                  <td className="py-3 px-5 text-sm text-black">{data.companyCode || "-"}</td>
                  <td className="py-3 px-5 text-sm text-black">{data.location}</td>
                  <td className="py-3 px-5 text-sm text-black">{getApprovalStatusBadge(data)}</td>
                  <td className="py-3 px-5 text-sm text-black">{formatDate(data.createdAt)}</td>
                  <td className="py-3 px-5 text-sm text-black">{data.createdBy?.username}</td>
                  <td className="py-3 px-5 text-sm text-black relative">
                    <div className="flex gap-3.5">
                      {data.approvalStatus === 'pending' ? (
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
                      ) : data.approvalStatus === 'approved' ? (
                        <>
                          <FaTrash 
                            className="cursor-pointer hover:text-red-600 transition-colors" 
                            color="gray" 
                            onClick={() => handleConfirm(data._id)} 
                          />
                          <FaPen 
                            className="cursor-pointer hover:text-blue-600 transition-colors" 
                            color="gray" 
                            onClick={() => handleShowForm(data)} 
                          />
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {data.rejectionMessage && (
                            <span title={data.rejectionMessage}>Rejected</span>
                          )}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-3 px-5 text-sm text-center text-black">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div onClick={() => handleShowForm()} className="bg-black p-3 bottom-10 right-10 rounded-full fixed cursor-pointer">
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
            <h2 className="text-lg font-semibold mb-4">Approve {approvingUser.username}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Code *
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={selectedCustomerCode}
                onChange={(e) => setSelectedCustomerCode(e.target.value)}
              >
                <option value="">Select a Customer Code</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.companyCode}>
                    {company.companyCode}
                  </option>
                ))}
              </select>
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
                onClick={() => setApprovingUser(null)}
                disabled={isApprovingClient}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={!selectedCustomerCode || isApprovingClient}
                onClick={handleApproveSubmit}
              >
                {isApprovingClient ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#00000066] z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Reject {rejectingUser.username}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 h-24 resize-none"
                placeholder="Please provide a reason for rejection..."
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