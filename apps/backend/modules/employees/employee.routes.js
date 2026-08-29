import { Router } from 'express';

import { getEmployees } from './employee.controller.js';

const router = Router();

router.get('/', getEmployees);

export default router;
