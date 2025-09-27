import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="flex h-scree">
      <Sidebar />
      <main className="flex-1 p-4 overflow-y-auto h-screen bg-gray-100">
        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
