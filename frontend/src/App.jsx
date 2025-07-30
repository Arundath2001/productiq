import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router/router";
import { useAuthStore } from "./store/useAuthStore";
import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster reverseOrder={false} />
    </>
  );
}

export default App;
