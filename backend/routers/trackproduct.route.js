import express from "express";
import { trackProduct } from "../controllers/trackproduct.controller.js";

const router = express.Router();

router.post("/", trackProduct);

export default router