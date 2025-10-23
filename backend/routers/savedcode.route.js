import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { deleteSavedCode, getSavedProductCode, getSavedProductCodeV2, saveProductCode } from "../controllers/savedcode.controller.js";

const router = express.Router();

router.post("/", protectRoute, saveProductCode);

router.get("/", getSavedProductCode);

router.delete("/:codeId", protectRoute, deleteSavedCode);

//v2 codes

router.get("/V2", protectRoute, getSavedProductCodeV2);


export default router;