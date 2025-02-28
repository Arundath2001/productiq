import express from "express";
import { checkAuth, createUser, deleteUser, editUser, getCompnayCode, getUserData, login, logout, updateExpoPushToken } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", protectRoute, createUser)

router.post("/login", login)

router.post("/logout", logout)

router.get("/companycode", protectRoute, getCompnayCode)

router.get("/check", protectRoute, checkAuth)

router.get('/usersdata', protectRoute, getUserData);

router.delete('/delete/:userId', protectRoute, deleteUser);

router.put("/edit/:userId", protectRoute, editUser );

router.post("/update-expo-token", protectRoute, updateExpoPushToken);

export default router;

