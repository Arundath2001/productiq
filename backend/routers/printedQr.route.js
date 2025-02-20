import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generatePrintedQr } from "../controllers/printedqr.controller.js";

const router = express.Router();

router.post("/", protectRoute, generatePrintedQr );

export default router;