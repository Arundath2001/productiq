import express from "express";
import { notification } from "../controllers/notification.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/sendNoti", protectRoute, notification);

export default router;