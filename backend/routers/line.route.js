import express from "express";
import { createLine, deleteLineById, getLineByBranchId } from "../controllers/line.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post('/create', protectRoute, createLine);

router.get('/:branchId', getLineByBranchId);

router.delete('/:lineId', deleteLineById);

export default router;