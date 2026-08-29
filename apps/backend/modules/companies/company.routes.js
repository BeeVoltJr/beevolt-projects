import { Router } from 'express';

import {
    createCompany,
    getCompanies,
    getCompanyByUid,
    updateCompany
} from './company.controller.js';

const router = Router();

router.get('/', getCompanies);
router.get('/:uid', getCompanyByUid);
router.post('/', createCompany);
router.put('/', updateCompany);
router.put('/:uid', updateCompany);

export default router;
