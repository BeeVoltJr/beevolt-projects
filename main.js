import { spawn } from 'node:child_process';

import 
{ 
    readFileSync, 
    readdirSync 
} from 'node:fs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const APPS_DIR   = path.resolve(__dirname, 'apps');

const mode = process.argv[2];

if(!['dev', 'start', 'deploy'].includes(mode)) 
{
    console.error('Uso: npm run dev | npm start | npm run deploy');
    process.exit(1);
}

const apps = readdirSync(APPS_DIR, 
{
    withFileTypes: true
})
.filter(entry => entry.isDirectory());

const processes = [];

let shuttingDown = false;

for(const app of apps) 
{
    const packageJsonPath = path.join(APPS_DIR, app.name, 'package.json');

    let packageJson;

    try 
    {
        packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    } 

    catch 
    {
        console.log(`[ SISTEMA ] Ignorando ${app.name} (package.json ausente ou inválido).`);
        continue;
    }

    const scripts = packageJson.scripts || {};

    const script = scripts[mode];

    if(!script || script.trim() === '...') 
    {
        console.log(`[ SISTEMA ] Ignorando ${app.name} (sem script "${mode}").`);
        continue;
    }

    console.log(`[ SISTEMA ] Iniciando ${app.name}...`);

    const childProcess = spawn(

        process.platform === 'win32' ? 'npm.cmd' : 'npm',
        ['run', mode],
        {
            cwd: path.join(APPS_DIR, app.name),
            stdio: 'inherit',
            env: process.env
        }
    );

    processes.push({
        name: app.name,
        process: childProcess
    });

    childProcess.on('exit', (code, signal) => 
    {
        if(shuttingDown) 
            return;

        //console.log(`[ SISTEMA ] ${app.name} finalizou com code=${code} signal=${signal}.`);

        shutdown('app-exit', 1);
    });
}

function shutdown(signal, exitCode = 0) 
{
    if(shuttingDown)
        return;

    shuttingDown = true;

    console.log(`\n[ SISTEMA ] Recebido ${signal}. Encerrando...`);

    for(const app of processes) 
    {
        console.log(`[ SISTEMA ] Encerrando ${app.name}...`);

        if(!app.process.killed)
            app.process.kill('SIGTERM');
    }

    process.exitCode = exitCode;
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

if(processes.length === 0) 
{
    console.error('[ SISTEMA ] Nenhum aplicativo executável foi encontrado.');
    process.exit(1);
}
