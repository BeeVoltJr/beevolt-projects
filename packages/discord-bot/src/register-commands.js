import dotenv               from 'dotenv';
import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';

dotenv.config();

const commands = 
[
    {
        name: 'empresas',
        description: 'Vizualizar empresas cadastradas.',
    },

    {
        name: 'teste',
        description: 'Apenas comando para DEBUG',
        options:[
            {
                name: 'params1',
                description: 'debug',
                type: ApplicationCommandOptionType.String
            },

            {
                name: 'params2',
                description: 'debug',
                type: ApplicationCommandOptionType.String
            },

            {
                name: 'params3',
                description: 'debug',
                type: ApplicationCommandOptionType.String
            }
        ]    
        
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => 
{
    try
    {
        console.log("[ BOT CMD ] Registrando slash commands em Beea no servidor BeeVolt\n");

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            {
                body: commands
            }
            
        );

        console.log("[ BOT CMD ] Comandos registrados com sucesso!\n");
    }

    catch(error)
    {
        console.log(`[ ERRO BOT CMD ] Houve um erro: ${error}`);
    }

})();