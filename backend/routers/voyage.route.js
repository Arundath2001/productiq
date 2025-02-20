import express from "express";
import { createVoyage, deleteVoyage, deleteVoyageData, exportVoyageData, getCompletedVoyages, getProductDetails, getVoyage, getVoyageNumber, getVoyages, uploadVoyage } from "../controllers/voyage.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", protectRoute, createVoyage );

router.post("/:voyageId/upload", protectRoute, uploadVoyage );

router.get("/voyagenumber", protectRoute, getVoyageNumber);

router.get("/voyages", protectRoute, getVoyages);

router.get("/completed-voyages", protectRoute, getCompletedVoyages);

router.get("/getproducts/:productCode", protectRoute, getProductDetails)

router.get("/:voyageId", protectRoute, getVoyage );

router.put("/export/:voyageId", protectRoute, exportVoyageData);

router.delete("/:voyageId", protectRoute, deleteVoyage );

router.delete("/:voyageId/data/:dataId", protectRoute, deleteVoyageData);


export default router; 