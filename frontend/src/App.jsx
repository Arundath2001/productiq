import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";


const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader className='size-15 animate-spin' />
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/login' element={authUser ? <HomePage /> : <LoginPage />} />
        <Route path='/allbills' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/sendNotification' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/voyage/:voyageId' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/completed' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/productqr' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/employee' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/client' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/voyages/getproducts/:productCode' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
