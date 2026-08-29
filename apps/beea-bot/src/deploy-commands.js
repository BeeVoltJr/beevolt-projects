import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { commandPayloads, loadCommandModules } from './loaders/command-loader.js';
import { SendConsoleDebug, SendConsoleErr } from '@beevolt/logging';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsDir = path.join(__dirname, 'commands');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

async function main() {
    try {
        const commands = await loadCommandModules(commandsDir);
        const payload = commandPayloads(commands);

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

        SendConsoleDebug('BOT CMD', 'Registrando slash commands no servidor BeeVolt');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: payload }
        );

        SendConsoleDebug('BOT CMD', 'Comandos registrados com sucesso!');
    } catch (error) {
        SendConsoleErr('BOT CMD', error?.stack || error?.message || String(error));
        process.exitCode = 1;
    }
}

await main();
