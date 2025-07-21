import express from "express";
import { createBranch, editBranch, getBranches } from "../controllers/branch.controller.js";

const router = express.Router();

router.post('/create', createBranch);
router.get('/branches', getBranches);
router.put('/:branchId', editBranch);

export default router;