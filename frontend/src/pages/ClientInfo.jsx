import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import PageHeader from "../components/PageHeader";
import UserForm from "../components/UserForm.jsx";
import { FaPen, FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import ConfirmAlert from "../components/ConfirmAlert.jsx";

const ClientInfo = () => {
  const { getUsersData, usersData } = useAuthStore();
  const [showUSerForm, setShowUserForm] = useState(false);
  const { deleteUser } = useAuthStore();
  const [showPopUp, setShowPopUp] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    getUsersData();
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

  const filteredClient = usersData?.clients
    ? usersData.clients.filter((client) =>
        client.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleConfirm = (userId) => {
    setSelectedUserId(userId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedUserId) {
      await deleteUser(selectedUserId, "employee");
      setShowConfirm(false);
      setSelectedUserId(null);
    }
  };

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

      <div className="mt-5">
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full table-auto border-separate border-spacing-y-2">
            <thead className="bg-white">
              <tr>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  #
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  CLIENT USERNAME
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                CUSTOMER CODE
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  CLIENT LOCATION
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  CREATED AT
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  CREATED BY
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 "></th>
              </tr>
            </thead>
            <tbody>
              {filteredClient && filteredClient.length > 0 ? (
                filteredClient.map((data, index) => (
                  <tr
                    key={data._id}
                    className="bg-white rounded-xl overflow-hidden"
                  >
                    <td className="py-3 px-5 text-sm text-black ">
                      {index + 1}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.username}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.companyCode}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.location}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {formatDate(data.createdAt)}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.createdBy?.username}
                    </td>
                    <td className="py-3 px-5 text-sm text-black relative">
                      <div className="flex gap-3.5">
                        <FaTrash
                          className="cursor-pointer"
                          color="gray"
                          onClick={() => handleConfirm(data._id)}
                        />
                        <FaPen
                          className="cursor-pointer "
                          color="gray"
                          onClick={() => handleShowForm(data)}
                        />
                      </div>
                    </td>
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

      <div
        onClick={handleShowForm}
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
    </div>
  );
};

export default ClientInfo;
