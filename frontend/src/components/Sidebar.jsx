import React from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  FaFileInvoice,
  FaShip,
  FaCheckCircle,
  FaQrcode,
  FaUsers,
  FaBuilding,
  FaSignOutAlt,
  FaBell,
  FaPlus,
  FaTruck,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ setSelectedTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname.startsWith("/voyage/")
    ? "VoyageDetails"
    : location.pathname.startsWith("/voyages/getproducts/")
    ? "AllCodeDetails"
    : location.pathname.replace("/", "");

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
    navigate(tab === "Voyages" ? "/" : `/${tab}`);
  };

  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen p-7 bg-[rgba(255,255,255,0.5)] backdrop-blur-lg flex flex-col justify-between">
      <div>
        <h1 className="text-4xl mb-5 font-bold linear bg-gradient-to-r from-[#6FB5FF] via-[#FFC79C] to-[#C39EF2] text-transparent bg-clip-text">
          Aswaq
          <br />
          Forwarder
        </h1>
        <ul>
          <li
            onClick={() => handleTabClick("Voyages")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "" || activeTab === "Voyages"
                ? "bg-black text-white"
                : ""
            }`}
          >
            <FaShip />
            Voyages
          </li>

          <li
            onClick={() => handleTabClick("completed")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "completed" ? "bg-black text-white" : ""
            }`}
          >
            <FaCheckCircle />
            Completed Voyages
          </li>

          <li
            onClick={() => handleTabClick("trackproduct")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "trackproduct" ? "bg-black text-white" : ""
            }`}
          >
            <FaTruck />
            Track Product
          </li>

          <li
            onClick={() => handleTabClick("productqr")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "productqr" ? "bg-black text-white" : ""
            }`}
          >
            <FaQrcode />
            All Product QR
          </li>

          <li
            onClick={() => handleTabClick("employee")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "employee" ? "bg-black text-white" : ""
            }`}
          >
            <FaUsers />
            Employee List
          </li>

          <li
            onClick={() => handleTabClick("client")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "client" ? "bg-black text-white" : ""
            }`}
          >
            <FaBuilding />
            Client Info
          </li>

          <li
            onClick={() => handleTabClick("customercode")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "customercode" ? "bg-black text-white" : ""
            }`}
          >
            <FaPlus />
            Customer Code
          </li>

          <li
            onClick={() => handleTabClick("allBills")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "allBills" ? "bg-black text-white" : ""
            }`}
          >
            <FaFileInvoice />
            All Bills
          </li>

          <li
            onClick={() => handleTabClick("sendNotification")}
            className={`flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer ${
              activeTab === "sendNotification" ? "bg-black text-white" : ""
            }`}
          >
            <FaBell />
            Send Notification
          </li>
        </ul>
      </div>

      <button
        type="submit"
        onClick={logout}
        className="bg-black text-white py-2 flex items-center gap-2 justify-center cursor-pointer hover:bg-gray-900 transition"
      >
        <FaSignOutAlt />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
