import express from "express";
import { getAppVersion } from "../controllers/appControl.controller.js";

const router = express.Router();

router.get('/verion', getAppVersion);

export default router;