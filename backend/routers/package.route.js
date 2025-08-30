import express from "express";
import { createPackage, getPackageDetails, getPackagesByGoniAndVoyage, uploadToPackage } from "../controllers/package.controller.js";
import { protectRoute } from '../middleware/auth.middleware.js';


const router = express.Router();

router.post('/package-details', protectRoute, getPackagesByGoniAndVoyage);
router.post("/create", protectRoute, createPackage);
router.post("/:packageId/upload", protectRoute, uploadToPackage);
router.post("/:packageId/get-package", protectRoute, getPackageDetails);

export default router;