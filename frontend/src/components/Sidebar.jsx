import React from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { FaSignOutAlt } from "react-icons/fa";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import {
  PlaneTakeoff,
  CheckCircle,
  Truck,
  QrCode,
  Users,
  UserPlus,
  FileText,
  LayoutDashboard,
  Building2,
  ShipIcon,
  User,
} from "lucide-react";

const Sidebar = ({ setSelectedTab }) => {
  const { authUser, logout } = useAuthStore();

  const menu = {
    superadmin: [
      { path: "branches", label: "Branches", icon: LayoutDashboard },
      { path: "clients", label: "Clients", icon: Building2 },
      { path: "customercode", label: "Customer Code", icon: UserPlus },
    ],
    air_cargo_admin: [
      { path: "voyage", label: "Voyages", icon: PlaneTakeoff },
      { path: "completed", label: "Completed Voyages", icon: CheckCircle },
      { path: "trackproduct", label: "Track Product", icon: Truck },
      { path: "allproduct", label: "All Product QR", icon: QrCode },
      { path: "employee", label: "Employee List", icon: Users },
      { path: "customercode", label: "Customer Code", icon: UserPlus },
      { path: "allbill", label: "All Bills", icon: FileText },
    ],
    ship_cargo_admin: [
      { path: "shipment", label: "Shipments", icon: ShipIcon },
    ],
    approve: [
      { path: "clients", label: "Clients", icon: Building2 },
      { path: "customercode", label: "Customer Code", icon: UserPlus },
    ],
  };

  const userRole = Array.isArray(authUser?.adminRoles)
    ? authUser.adminRoles[0]
    : authUser?.adminRoles;

  return (
    <div className="min-h-screen border-r-1 border-gray-200 p-7 bg-[rgba(255,255,255,0.5)] backdrop-blur-lg flex flex-col justify-between">
      <div>
        <h1 className="text-4xl mb-5 font-bold linear bg-gradient-to-r from-[#6FB5FF] via-[#FFC79C] to-[#C39EF2] text-transparent bg-clip-text">
          Aswaq
          <br />
          Forwarder
        </h1>

        <nav className="flex flex-col gap-2 mt-6">
          {menu[userRole]?.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex text-base rounded-xl items-center gap-2 px-3 py-2 cursor-pointer transition ${
                    isActive
                      ? "bg-black text-white"
                      : "text-black hover:bg-gray-200"
                  }`
                }
              >
                <Icon />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-300">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-[#6FB5FF] via-[#FFC79C] to-[#C39EF2] p-2 rounded-full flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {authUser?.username || "User"}
              </p>
              <p className="text-xs text-gray-800 capitalize">
                {userRole?.replace(/_/g, " ")}{" "}
                {authUser.branchName ? `| ${authUser.branchName}` : ""}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full bg-black text-white py-2 flex items-center gap-2 justify-center cursor-pointer hover:bg-gray-900 transition"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
