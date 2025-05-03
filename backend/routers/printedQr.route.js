import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  generatePrintedQrBatch, 
  updatePrintStatus, 
  getBatches, 
  getBatchWithQRs, 
  getFailedPrints, 
  getBatchesByProductCode
} from "../controllers/printedqr.controller.js";

const router = express.Router();

router.post("/batch", protectRoute, generatePrintedQrBatch);
router.post("/batch/update-status", protectRoute, updatePrintStatus);
router.get("/batches", protectRoute, getBatches);
router.get("/batches/:batchId", protectRoute, getBatchWithQRs);
router.get("/failed", protectRoute, getFailedPrints);
router.get("/:productCode/batches", protectRoute, getBatchesByProductCode);


export default router;