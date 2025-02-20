import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import PageHeader from "../components/PageHeader";
import { FaEdit, FaEllipsisV, FaPlus } from "react-icons/fa";
import UserForm from "../components/UserForm.jsx";
import IconButton from "../components/IconButton.jsx";
import { FaTrash } from "react-icons/fa";

const EmployeeList = () => {
  const { getUsersData, usersData, deleteUser } = useAuthStore();
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPopUp, setShowPopUp] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsersData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
  };

  const handleShowForm = (user = null, changePassword = false) => {
    setSelectedUser(user ? { ...user, changePassword } : null);
    setShowUserForm(true);
  };

  const handlePopUpToggle = (index) => {
    setShowPopUp(showPopUp === index ? null : index);
  };

  const filteredEmployees = usersData.employees.filter((employee) =>
    employee.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <PageHeader mainHead="Employee List" subText={`${filteredEmployees.length} Employees`} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showDateFilter={false} />

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full table-auto border-separate border-spacing-y-2">
          <thead className="bg-white">
            <tr>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">#</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">Employee Username</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">Position</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">Created Date</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">Created By</th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((data, index) => (
                <tr key={data._id} className="bg-white rounded-xl overflow-hidden">
                  <td className="py-3 px-5 text-sm text-black">{index + 1}</td>
                  <td className="py-3 px-5 text-sm text-black">{data.username}</td>
                  <td className="py-3 px-5 text-sm text-black">{data.position}</td>
                  <td className="py-3 px-5 text-sm text-black">{formatDate(data.createdAt)}</td>
                  <td className="py-3 px-5 text-sm text-black">{data.createdBy}</td>
                  <td className="py-3 px-5 text-sm text-black relative">
                    <FaEllipsisV className="cursor-pointer" size={15} onClick={() => handlePopUpToggle(index)} />
                    {showPopUp === index && (
                      <div className="fixed right-5 rounded-xl flex flex-col p-1.5 bg-gray-300 gap-0.5 z-10">
                        <IconButton btnName="Delete" btnType="delete" icon={FaTrash} onClick={() => deleteUser(data._id, "employee")} />
                        <IconButton btnName="Edit" icon={FaEdit} onClick={() => handleShowForm(data)} />
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-3 px-5 text-sm text-center text-black">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div onClick={handleShowForm} className="bg-black p-3 bottom-10 right-10 rounded-full fixed cursor-pointer">
        <FaPlus size={25} color="#FFFFFF" />
      </div>

      {showUserForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <UserForm formTitile="ENTER EMPLOYEE DETAILS" role="employee" closeForm={setShowUserForm} userData={selectedUser} />
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
