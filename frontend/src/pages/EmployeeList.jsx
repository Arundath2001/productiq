import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import PageHeader from "../components/PageHeader";
import { FaEdit, FaEllipsisV, FaPen, FaPlus } from "react-icons/fa";
import UserForm from "../components/UserForm.jsx";
import { FaTrash } from "react-icons/fa";
import ConfirmAlert from "../components/ConfirmAlert.jsx";

const EmployeeList = () => {
  const { getEmployee, usersData, deleteUser, authUser } = useAuthStore();
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    getEmployee(authUser.branchId);
  }, [authUser.branchId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${date.getFullYear()}`;
  };

  const handleShowForm = (user = null, changePassword = false) => {
    setSelectedUser(user ? { ...user, changePassword } : null);
    setShowUserForm(true);
  };

  const filteredEmployees = usersData.employees.filter((employee) =>
    employee.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        mainHead="Employee List"
        subText={`${filteredEmployees.length} Employees`}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDateFilter={false}
        placeholder="Search by employee username"
      />

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full table-auto border-separate border-spacing-y-2">
          <thead className="bg-white shadow-sm">
            <tr>
              <th className="py-3 px-5 text-left text-xs font-semibold text-[#000435]">
                #
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-[#000435]">
                Employee Username
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-[#000435]">
                Position
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-[#000435]">
                Created Date
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-[#000435]">
                Created By
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((data, index) => (
                <tr
                  key={data._id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm"
                >
                  <td className="py-3 px-5 text-sm text-black">{index + 1}</td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.username}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.position}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {formatDate(data.createdAt)}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
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

      <div
        onClick={handleShowForm}
        className="bg-black p-3 bottom-10 right-10 rounded-full fixed cursor-pointer"
      >
        <FaPlus size={25} color="#FFFFFF" />
      </div>

      {showUserForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <UserForm
            formTitile="ENTER EMPLOYEE DETAILS"
            role="employee"
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

export default EmployeeList;
