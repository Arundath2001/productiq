import express from "express";
import { closeVoyage, createVoyage, deleteVoyage, deleteVoyageData, exportVoyageData, getAllPendingCompaniesSummary, getAllVoyageProducts, getCompaniesSummaryByVoyage, getCompanyDetailsByVoyage, getCompletedCompaniesSummaryByVoyage, getCompletedCompanyDetailsByVoyage, getCompletedVoyages, getCompletedVoyagesByCompany, getPendingVoyages, getProductDetails, getVoyage, getVoyageByCompany, getVoyageNumber, getVoyages, uploadVoyage } from "../controllers/voyage.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../lib/multer.js";

const router = express.Router();

router.post("/create", protectRoute, createVoyage);

router.post("/:voyageNumber/upload", protectRoute, upload.single('image'), uploadVoyage);

router.get("/voyagenumber", protectRoute, getVoyageNumber);

router.get("/voyages", protectRoute, getVoyages);

router.get("/pending-voyages", protectRoute, getPendingVoyages);

router.get("/completed-voyages", protectRoute, getCompletedVoyages);

router.get("/getproducts/:productCode", protectRoute, getProductDetails)

router.get("/:voyageId", protectRoute, getVoyage);

router.put("/export/:voyageId", protectRoute, exportVoyageData);

router.put('/close/:voyageId', protectRoute, closeVoyage);

router.delete("/:voyageId", protectRoute, deleteVoyage);

router.delete("/:voyageId/data/:dataId", protectRoute, deleteVoyageData);

router.get("/company/:companyCode", protectRoute, getVoyageByCompany);

router.get('/:voyageId/companies', getCompaniesSummaryByVoyage);

router.get('/:voyageId/companies/:companyCode', getCompanyDetailsByVoyage);

router.get("/:voyageId/all-products", protectRoute, getAllVoyageProducts);

router.get("/:voyageId/completed-companies", protectRoute, getCompletedCompaniesSummaryByVoyage);

router.get("/:voyageId/completed-companies/:companyCode", protectRoute, getCompletedCompanyDetailsByVoyage);

router.get('/completed-company/:companyCode', protectRoute, getCompletedVoyagesByCompany);

router.get('/companies/pending', protectRoute, getAllPendingCompaniesSummary);


export default router; 