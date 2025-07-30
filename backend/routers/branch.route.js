import express from "express";
import {
    getBranches,
    getBranchById,
    getBranchAdmins,
    checkUsernames,
    createBranchWithAdmins,
    updateBranch,
    deleteBranch,
    addAdminToBranch,
    removeAdminFromBranch,
    editBranchAdmin
} from "../controllers/branch.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/branches", protectRoute, getBranches);
router.get("/:id", protectRoute, getBranchById);
router.post("/create-with-admins", protectRoute, createBranchWithAdmins);
router.put("/:id", protectRoute, updateBranch);
router.delete("/:id", protectRoute, deleteBranch);

router.get("/:branchId/admins", protectRoute, getBranchAdmins);
router.post("/check-usernames", protectRoute, checkUsernames);
router.post("/:branchName/add-admin", protectRoute, addAdminToBranch);
router.delete("/admin/:adminId", protectRoute, removeAdminFromBranch);
router.put("/admin/:adminId", protectRoute, editBranchAdmin);

export default router;