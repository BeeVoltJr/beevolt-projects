import cors from 'cors';
import express from 'express';

import { SendConsoleDebug, SendConsoleErr } from '@beevolt/logging';
import { registerInternalRoutes } from './routes/internal.routes.js';

export function createBotHttpServer({ client, port = Number(process.env.BEEA_PORT || 4000) } = {}) {
    const app = express();

    app.disable('x-powered-by');
    app.use(cors());
    app.use(express.json({ limit: '1mb' }));

    app.get('/health', (_req, res) => {
        res.sendStatus(200);
    });

    registerInternalRoutes(app, {
        client,
        channelId: process.env.BEEA_LOG_CHANNEL_ID || process.env.DISCORD_LOG_CHANNEL_ID
    });

    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint não encontrado.'
        });
    });

    app.use((err, _req, res, _next) => {
        SendConsoleErr('BEEA', err?.stack || err?.message || String(err));

        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor.'
        });
    });

    const server = app.listen(port, () => {
        SendConsoleDebug('BEEA', `Servidor HTTP iniciado na porta ${port}`);
    });

    return { app, server };
}
