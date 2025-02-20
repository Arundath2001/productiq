import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import PageHeader from "../components/PageHeader";
import { FaEdit, FaEllipsisV, FaPlus } from 'react-icons/fa';
import UserForm from "../components/UserForm.jsx";
import IconButton from "../components/IconButton.jsx";
import { FaTrash } from 'react-icons/fa';

const ClientInfo = () => {
  const { getUsersData, usersData } = useAuthStore();
  const [ showUSerForm, setShowUserForm ] = useState(false);
  const { deleteUser } = useAuthStore();
  const [showPopUp, setShowPopUp] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    getUsersData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleShowForm = (user = null, changePassword = false) => {
    setSelectedUser(user ? { ...user, changePassword } : null);
    setShowUserForm(true);
  };

  const handlePopUpToggle = (index) => {
    setShowPopUp(showPopUp === index ? null : index);
  };

  const filteredClient = usersData.clients.filter((client) =>
    client.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <PageHeader mainHead="Employee List" subText={`${filteredClient.length} Employees`} searchQuery={searchQuery} setSearchQuery={setSearchQuery} showDateFilter={false} />


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
                  COMPANY CODE
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  COMPANY CODE
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  CLIENT LOCATION
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  CREATED BY
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 "></th>
              </tr>
            </thead>
            <tbody>
              {filteredClient &&
              filteredClient.length > 0 ? (
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
                      {data.createdBy}
                    </td>
                    <td className="py-3 px-5 text-sm text-black relative">
                      <FaEllipsisV className="cursor-pointer" size={15} onClick={() => handlePopUpToggle(index)} />
                      
                      {showPopUp === index && (
                        <div className="fixed right-5 rounded-xl flex flex-col p-1.5 bg-gray-300 gap-0.5 z-10">
                          <IconButton btnName='Delete' btnType="delete" icon={FaTrash} onClick={() => deleteUser(data._id, "employee")} />
                          <IconButton btnName='Edit' icon={FaEdit} onClick={() => handleShowForm(data)}  />
                        </div>
                      )}
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

      <div onClick={handleShowForm} className="bg-black p-3 bottom-10 right-10 rounded-full fixed cursor-pointer">
        <FaPlus size={25} color="#FFFFFF" />
      </div>

      {showUSerForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <UserForm formTitile='ENTER CLIENT DETAILS' role='client' closeForm={setShowUserForm} userData={selectedUser} />
        </div>
      )}
    </div>
  );
};

export default ClientInfo;
