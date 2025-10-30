import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createSeaContainer, deleteSeaContainer, getSeaContainerByBranchAndVoyage } from "../controllers/seaContainer.controller.js";

const router = express.Router();

router.post('/create', protectRoute, createSeaContainer);

router.get('/:branchId/sea-voyage/:seaVoyageId', getSeaContainerByBranchAndVoyage);

router.delete('/:containerId', deleteSeaContainer);

export default router;