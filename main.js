import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_DIR = path.resolve(__dirname, '../apps');

const mode = process.argv[2];

if (!['dev', 'start'].includes(mode)) {
    console.error(
        'Uso: npm run dev | npm start'
    );

    process.exit(1);
}

const apps = readdirSync(APPS_DIR, {
    withFileTypes: true
})
.filter(entry => entry.isDirectory());

const processes = [];

for (const app of apps) {

    console.log(
        `[ SISTEMA ] Iniciando ${app.name}...`
    );

    const process = spawn(
        'npm',
        ['run', mode],
        {
            cwd: path.join(APPS_DIR, app.name),
            stdio: 'inherit',
            shell: true
        }
    );

    processes.push({
        name: app.name,
        process
    });
}

function shutdown(signal) {

    console.log(
        `\n[ SISTEMA ] Recebido ${signal}. Encerrando...`
    );

    for (const app of processes) {

        console.log(
            `[ SISTEMA ] Encerrando ${app.name}...`
        );

        app.process.kill('SIGTERM');
    }

}


process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));