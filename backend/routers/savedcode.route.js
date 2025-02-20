import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSavedProductCode, saveProductCode } from "../controllers/savedcode.controller.js";

const router = express.Router();

router.post("/", protectRoute, saveProductCode );

router.get("/", protectRoute, getSavedProductCode );

export default router;