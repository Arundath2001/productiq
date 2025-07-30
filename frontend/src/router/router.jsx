import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import DashboardLayout from "../layouts/DashboardLayout";
import Voyages from "../pages/Voyages";
import ProtectedRoute from "../components/ProtectedRoute";
import CompletedVoyages from "../pages/CompletedVoyages";
import TrackProduct from "../pages/TrackProduct";
import AllProductQr from "../pages/AllProductQr";
import EmployeeList from "../pages/EmployeeList";
import AllBills from "../pages/AllBills";
import CustomerCodeCreation from "../pages/CustomerCodeCreation";
import VoyageByCompany from "../pages/VoyageByCompany";
import CompletedVoyageByCompany from "../pages/CompletedVoyageByCompany";
import CompletedVoyageDetails from "../pages/CompletedVoyageDetails";
import VoyageDetails from "../pages/VoyageDetails";
import Branches from "../pages/superadmin/Branches";
import ClientInfo from "../pages/ClientInfo";
import Shipment from "../pages/ship-cargo/Shipment";
import BranchDetails from "../pages/superadmin/BranchDetails";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ProtectedRoute redirectBasedOnRole={true} />,
      },
      {
        path: "voyage",
        element: (
          <ProtectedRoute
            allowedRoles={["air_cargo_admin", "ship_cargo_admin"]}
          >
            <Voyages />
          </ProtectedRoute>
        ),
      },
      {
        path: "shipment",
        element: (
          <ProtectedRoute allowedRoles={["ship_cargo_admin"]}>
            <Shipment />
          </ProtectedRoute>
        ),
      },
      {
        path: "completed",
        element: (
          <ProtectedRoute>
            <CompletedVoyages />
          </ProtectedRoute>
        ),
      },
      {
        path: "trackproduct",
        element: (
          <ProtectedRoute>
            <TrackProduct />
          </ProtectedRoute>
        ),
      },
      {
        path: "allproduct",
        element: (
          <ProtectedRoute>
            <AllProductQr />
          </ProtectedRoute>
        ),
      },
      {
        path: "employee",
        element: (
          <ProtectedRoute>
            <EmployeeList />
          </ProtectedRoute>
        ),
      },
      {
        path: "allbill",
        element: (
          <ProtectedRoute>
            <AllBills />
          </ProtectedRoute>
        ),
      },
      {
        path: "customercode",
        element: (
          <ProtectedRoute>
            <CustomerCodeCreation />
          </ProtectedRoute>
        ),
      },
      {
        path: "voyage/:voyageId/companies",
        element: (
          <ProtectedRoute>
            <VoyageByCompany />
          </ProtectedRoute>
        ),
      },
      {
        path: "completed/:voyageId/companies",
        element: (
          <ProtectedRoute>
            <CompletedVoyageByCompany />
          </ProtectedRoute>
        ),
      },
      {
        path: "completed/:voyageId/companies/:companyCode",
        element: (
          <ProtectedRoute>
            <CompletedVoyageDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "voyage/:voyageId/companies/:companyCode",
        element: (
          <ProtectedRoute>
            <VoyageDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "branches",
        element: (
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <Branches />
          </ProtectedRoute>
        ),
      },
      {
        path: "clients",
        element: (
          <ProtectedRoute>
            <ClientInfo />
          </ProtectedRoute>
        ),
      },
      {
        path: "branches/:branchId",
        element: (
          <ProtectedRoute>
            <BranchDetails />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
