import express from 'express';
import {
    createCompany,
    getAllCompanies,
    updateCompany,
    deleteCompany
} from '../controllers/company.controller.js'; 
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();


router.post('/companies', protectRoute, createCompany);           // CREATE
router.get('/companies', protectRoute, getAllCompanies);          // READ ALL
router.put('/companies/:id', protectRoute, updateCompany);        // UPDATE
router.delete('/companies/:id', protectRoute, deleteCompany);     // DELETE


export default router;