import express from 'express';
import {
    createCompany,
    getAllCompanies,
    updateCompany,
    deleteCompany
} from '../controllers/company.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();


router.post('/companies', protectRoute, createCompany);
router.get('/companies', protectRoute, getAllCompanies);
router.put('/companies/:id', protectRoute, updateCompany);
router.delete('/companies/:id', protectRoute, deleteCompany);


export default router;