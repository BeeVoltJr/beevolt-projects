import cors from 'cors';
import express from 'express';

import companyRoutes from './modules/companies/company.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import { SendConsoleDebug, SendConsoleErr } from '@beevolt/logging';

const app = express();

app.disable('x-powered-by');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
    SendConsoleDebug('BACKEND HTTP', `${req.method} ${req.originalUrl}`);
    next();
});

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok'
    });
});

app.use('/api/companies', companyRoutes);
app.use('/api/employees', employeeRoutes);

app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado.'
    });
});

app.use((err, _req, res, _next) => {
    SendConsoleErr('BACKEND', err?.stack || err?.message || String(err));

    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor.'
    });
});

export default app;
