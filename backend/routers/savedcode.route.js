import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { deleteSavedCode, getFailedPrintsForSavedCode, getPrintStatusSummaryForSavedCode, getSavedProductCode, saveProductCode } from "../controllers/savedcode.controller.js";

const router = express.Router();

router.post("/", protectRoute, saveProductCode );

router.get("/", protectRoute, getSavedProductCode );

router.delete("/:codeId", protectRoute, deleteSavedCode );

router.get("/:productCode/failed", getFailedPrintsForSavedCode);

router.get("/:productCode/summary", getPrintStatusSummaryForSavedCode);

export default router;