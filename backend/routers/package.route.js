import express from "express";
import { createPackage, getPackageDetails, getPackagesByGoniAndVoyage, packageDetailsByVoyageAndCompany, uploadToPackage } from "../controllers/package.controller.js";
import { protectRoute } from '../middleware/auth.middleware.js';


const router = express.Router();

router.post('/package-details', protectRoute, getPackagesByGoniAndVoyage);
router.post("/create", protectRoute, createPackage);
router.post("/:packageId/upload", protectRoute, uploadToPackage);
router.get("/:packageId/get-package", protectRoute, getPackageDetails);
router.get("/:companyId/voyage/:voyageId", protectRoute, packageDetailsByVoyageAndCompany);


export default router;