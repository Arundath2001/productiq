import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Loader } from "lucide-react";

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectBasedOnRole = false,
}) => {
  const { authUser, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="size-15 animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  const getUserRoles = (user) => {
    if (Array.isArray(user.role) && user.role.length > 0) {
      return user.role;
    }

    if (Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles;
    }
    if (Array.isArray(user.adminRoles) && user.adminRoles.length > 0) {
      return user.adminRoles;
    }

    if (typeof user.role === "string") {
      return [user.role];
    }

    console.log(user.adminRoles);

    return [];
  };

  if (redirectBasedOnRole) {
    const userRoles = getUserRoles(authUser);

    if (userRoles.includes("superadmin")) {
      return <Navigate to="/dashboard/branches" replace />;
    }

    if (userRoles.includes("air_cargo_admin")) {
      return <Navigate to="/dashboard/voyage" replace />;
    }

    if (userRoles.includes("ship_cargo_admin")) {
      return <Navigate to="/dashboard/shipment" replace />;
    }

    if (userRoles.includes("approve")) {
      return <Navigate to="/dashboard/clients" replace />;
    }

    return <Navigate to="/dashboard/voyage" replace />;
  }

  if (allowedRoles.length > 0) {
    const userRoles = getUserRoles(authUser);
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Required roles: {allowedRoles.join(", ")}
            </p>
            <p className="text-sm text-gray-400">
              Your roles: {getUserRoles(authUser).join(", ")}
            </p>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
