import express from 'express';
import { contactController } from '../controllers/contact.controller.js';

const router = express.Router();

router.post('/', contactController );

export default router;