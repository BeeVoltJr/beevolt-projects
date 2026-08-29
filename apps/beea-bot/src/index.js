import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SendConsoleDebug, SendConsoleErr } from '@beevolt/logging';
import { createBot, loginBot } from './bot.js';
import { createBotHttpServer } from './server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const shutdownState = {
    running: false
};

const { client } = await createBot();
const { server } = createBotHttpServer({ client });

async function shutdown(signal) {
    if (shutdownState.running) {
        return;
    }

    shutdownState.running = true;

    SendConsoleDebug('BEEA', `Recebido ${signal}. Encerrando...`);

    await new Promise(resolve => {
        server.close(error => {
            if (error) {
                SendConsoleErr('BEEA', error?.message || String(error));
            }

            resolve();
        });
    });

    try {
        client.destroy();
    } catch (error) {
        SendConsoleErr('BEEA', error?.message || String(error));
    }

    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

try {
    await loginBot(client);
} catch (error) {
    SendConsoleErr('BEEA', error?.stack || error?.message || String(error));
    await new Promise(resolve => {
        server.close(() => resolve());
    });
    process.exit(1);
}
