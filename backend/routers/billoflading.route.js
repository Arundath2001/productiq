import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { deleteBillOfLading, getAllBills, getBillById, saveBillOFLading, updateBillOfLading } from "../controllers/billoflading.controller.js";

const router = express.Router();

router.post('/', protectRoute, saveBillOFLading );
router.get('/', protectRoute, getAllBills );
router.get('/:id', protectRoute, getBillById );
router.put("/:id", protectRoute, updateBillOfLading);
router.delete("/:id", protectRoute, deleteBillOfLading);

export default router;