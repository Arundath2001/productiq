import express from "express";
import { createPackage, uploadToPackage } from "../controllers/package.controller.js";

const router = express.Router();

router.post("/create", createPackage);
router.post("/:packageId/upload", uploadToPackage);

export default router;