import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { deleteSavedCode, getSavedProductCode, saveProductCode } from "../controllers/savedcode.controller.js";

const router = express.Router();

router.post("/", protectRoute, saveProductCode );

router.get("/", getSavedProductCode );

router.delete("/:codeId", protectRoute, deleteSavedCode );

export default router;