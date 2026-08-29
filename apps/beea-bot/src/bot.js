import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client, Events, GatewayIntentBits } from 'discord.js';

import { SendConsoleDebug, SendConsoleErr } from '@beevolt/logging';
import { buildCommandRegistry, loadCommandModules } from './loaders/command-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, 'commands');

async function replyWithFallback(interaction, message) {
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(message);
        return;
    }

    await interaction.reply(message);
}

export async function createBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds
        ]
    });

    const commandModules = await loadCommandModules(COMMANDS_DIR);
    const registry = buildCommandRegistry(commandModules);

    client.once(Events.ClientReady, readyClient => {
        SendConsoleDebug('BEEA', `${readyClient.user.tag} acordou!`);
    });

    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) {
            return;
        }

        const command = registry.get(interaction.commandName);

        if (!command) {
            await replyWithFallback(interaction, {
                content: 'Esse comando não existe!',
                ephemeral: true
            });
            return;
        }

        try {
            await command.execute(interaction, {
                client,
                commands: registry
            });
        } catch (error) {
            SendConsoleErr('CMD', error?.stack || error?.message || String(error));

            await replyWithFallback(interaction, {
                content: 'Não consegui processar seu comando de interação!',
                ephemeral: true
            });
        }
    });

    return { client, registry, commandModules };
}

export async function loginBot(client) 
{
    await client.login(process.env.TOKEN);
}
