import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createSeaVoyage, deleteSeaVoyage, getSeaVoyagesByBranchId } from "../controllers/seaVoyage.controller.js";

const router = express.Router();

router.post('/create', protectRoute, createSeaVoyage);

router.get('/:branchId', getSeaVoyagesByBranchId);

router.delete('/delete/:seaVoyageId', deleteSeaVoyage);

export default router;