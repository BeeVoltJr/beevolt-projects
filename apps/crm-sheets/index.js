import 
{   
    beedb,
    
    LOG_TYPE,
    SendDiscordLog,
    SendConsoleLog, 
    SendConsoleErr,
    SendConsoleWarn,
    SendConsoleDebug 

} from '@beevolt/shared';

async function main() 
{
    SendConsoleDebug("CRM SHEETS", "Bee Volt CRM iniciado...");

    const company_count  = await beedb.getCount('companies');
    const employee_count = await beedb.getCount('employees');;

    SendConsoleDebug("CRM SHEETS", 
        `Total de empresas: ${company_count}\n` +
        `Total de colaboradores: ${employee_count}`
    );

    SendDiscordLog(LOG_TYPE.debug,
    `\`\`\`O sistema foi inicializado com sucesso!\n\n` +
    `• ${company_count} empresas carregadas\n` +
    `• ${employee_count} calaboradores carregados\`\`\``);
}

main();