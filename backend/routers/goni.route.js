import express from "express";
import { createGoni, deleteGoni, getGoniDetails } from "../controllers/goni.controller.js";
import { protectRoute } from '../middleware/auth.middleware.js';


const router = express.Router();

router.post('/create', protectRoute, createGoni);
router.get('/goni-details', protectRoute, getGoniDetails);
router.delete('/:goniId/delete', protectRoute, deleteGoni);

export default router;