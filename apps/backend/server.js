import app from './app.js';

import 
{
    SendConsoleDebug, 
    SendConsoleErr 
} from '@beevolt/logging';

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, () => 
{
    SendConsoleDebug('BACKEND', `Servidor iniciado na porta ${PORT}`);
});

function shutdown(signal) 
{
    SendConsoleDebug('BACKEND', `Recebido ${signal}. Encerrando...`);

    server.close(err => 
    {
        if(err) 
        {
            SendConsoleErr('BACKEND', err.message || String(err));
            process.exit(1);
            return;
        }

        SendConsoleDebug('BACKEND', 'Servidor encerrado.');
        process.exit(0);
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
