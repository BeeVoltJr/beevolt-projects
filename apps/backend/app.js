import express from 'express';
import cors from 'cors';

import companyRoutes from './modules/companies/company.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// HEALTH CHECK

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok'
    });
});

// ROTAS

app.use('/api/companies', companyRoutes);

// 404 HANDLER

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado.'
    });
});

// ERRO HANDLER

app.use((err, req, res, next) => 
{

    console.error('[ERROR]', err);

    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor.'
    });

});

export default app;