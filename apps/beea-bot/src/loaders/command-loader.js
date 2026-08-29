import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadCommandModules(commandsDir) {
    const entries = await fs.readdir(commandsDir, { withFileTypes: true });
    const modules = [];

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.js')) {
            continue;
        }

        const modulePath = path.join(commandsDir, entry.name);
        const commandModule = await import(pathToFileURL(modulePath).href);
        const command = commandModule.default;

        if (!command || typeof command !== 'object') {
            throw new Error(`Comando inválido em ${entry.name}: export default ausente.`);
        }

        if (!command.data || typeof command.data.name !== 'string') {
            throw new Error(`Comando inválido em ${entry.name}: metadata data.name ausente.`);
        }

        if (typeof command.execute !== 'function') {
            throw new Error(`Comando inválido em ${entry.name}: execute() ausente.`);
        }

        const expectedName = path.basename(entry.name, '.js');
        if (command.data.name !== expectedName) {
            throw new Error(
                `Nome do comando e arquivo divergentes em ${entry.name}: esperado "${expectedName}", recebido "${command.data.name}".`
            );
        }

        modules.push(command);
    }

    return modules;
}

export function buildCommandRegistry(commands) {
    return new Map(commands.map(command => [command.data.name, command]));
}

export function commandPayloads(commands) {
    return commands.map(command => command.data.toJSON());
}
