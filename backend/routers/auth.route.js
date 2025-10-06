import express from "express";
import {
    checkAuth,
    completeRegistration,
    deleteUser,
    editUser,
    getUserData,
    login,
    logout,
    removeExpoPushToken,
    resendRegistrationOTP,
    sendRegistrationOTP,
    updateExpoPushToken,
    verifyOTP,
    approveClient,
    rejectClient,
    getPendingClients,
    getClientsByStatus,
    resubmitRejectedClient,
    changePassword,
    verifyForgotPasswordOTP,
    resetPassword,
    resendForgotPasswordOTP,
    checkForgotPasswordStatus,
    sendForgotPasswordOTP,
    adminLogin,
    employeeLogin,
    clientLogin,
    createEmployee,
    getEmployee
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Authentication routes
router.post("/:branchId/register", protectRoute, createEmployee);
router.post("/login", login);
router.post("/employee-login", employeeLogin);
router.post("/client-login", clientLogin);
router.post("/adminlogin", adminLogin);
router.post("/logout", logout);
// router.get("/companycode", protectRoute, getCompnayCode)
router.get("/check", protectRoute, checkAuth);
router.get('/usersdata', protectRoute, getUserData);
router.get('/:branchId/getEmployee', protectRoute, getEmployee);
router.delete('/delete/:userId', protectRoute, deleteUser);
router.put("/edit/:userId", protectRoute, editUser);

// Expo push token routes
router.post("/update-expo-token", protectRoute, updateExpoPushToken);
router.post("/remove-expo-token", protectRoute, removeExpoPushToken);

// OTP and registration routes
router.post("/send-registration-otp", sendRegistrationOTP);
router.post("/verify-otp", verifyOTP);
router.post("/resend-registration-otp", resendRegistrationOTP);
router.post("/complete-registration", completeRegistration);

// Client approval routes
router.put("/approve-client/:userId", protectRoute, approveClient);
router.put("/reject-client/:userId", protectRoute, rejectClient);
router.get("/pending-clients", protectRoute, getPendingClients);
router.get("/clients/:status", protectRoute, getClientsByStatus);
router.put("/resubmit-client/:userId", protectRoute, resubmitRejectedClient);
router.post("/changepassword", protectRoute, changePassword);
router.post('/forgot-password/send-otp', sendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOTP);
router.post('/forgot-password/reset-password', resetPassword);
router.post('/forgot-password/resend-otp', resendForgotPasswordOTP);
router.get('/forgot-password/status', checkForgotPasswordStatus);

export default router;