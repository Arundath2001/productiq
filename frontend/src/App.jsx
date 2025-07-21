import React, { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import { useAuthStore } from "./store/useAuthStore";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import ContactUs from "./pages/ContactUs";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [authUser, location.pathname, navigate]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-15 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/allbills"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/sendNotification"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        {/* Active voyage routes */}
        <Route
          path="/voyage/:voyageId/companies/:companyCode"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/voyage/:voyageId/companies"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        {/* Completed voyage routes */}
        <Route
          path="/completed-voyage/:voyageId/companies/:companyCode"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/completed-voyage/:voyageId/companies"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/completed"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/productqr"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/employee"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/client"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/voyages/getproducts/:productCode"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/customercode"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/trackproduct"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        {/* Publicly accessible Support page */}
        <Route path="/contact" element={<ContactUs />} />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
