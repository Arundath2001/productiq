import express from "express";
import { createContainerCompany, deleteContainerCompanyById, getcontainerCompanyByBranchId } from "../controllers/containerCompany.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post('/create', protectRoute, createContainerCompany);

router.get('/:branchId/line/:lineId', getcontainerCompanyByBranchId);

router.delete('/:containerCompanyId', deleteContainerCompanyById);

export default router;