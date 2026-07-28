import express              from 'express';
import sqlite3Package       from 'sqlite3';
import cors                 from 'cors';
import fs                   from 'fs';
import path                 from 'path';
import dotenv               from 'dotenv';
import { fileURLToPath }    from 'url';

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

import 
{ 
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
    AttachmentBuilder,
    MessageFlags,
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    MediaGalleryBuilder, 
    MediaGalleryItemBuilder

} from 'discord.js';

const sqlite3 = sqlite3Package.verbose();

const commands = {};

const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const embedlog = JSON.parse(fs.readFileSync(path.join(__dirname, 'config/embed-log.json'), 'utf-8'));

const client = new Client
(
    {
        intents: 
        [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    }
);

client.once(Events.ClientReady, (readyClient) => 
{
    SendConsoleDebug("BEEA", `${readyClient.user.tag} acordou!`);
   
    app.get("/health", (req, res) => {
        res.sendStatus(200);
    });

    app.post("/internal/log", async (req, res) =>
    {
        try
        {
            const channel = await readyClient.channels.fetch("1529939818199519242");

            await channel.send({
                components: [req.body],
                flags: MessageFlags.IsComponentsV2
            });

            res.sendStatus(200);
        }

        catch(err)
        {
            SendConsoleErr("ROTAS", "Erro na rota internal/log");

            res.sendStatus(500);
        }
    });

    app.listen(4000, async() => {});
});

client.on('interactionCreate', async (interaction) => 
{
    if(!interaction.isChatInputCommand()) return;

    const cmd = commands[interaction.commandName];

    if(!cmd) 
    {
        await interaction.reply('Esse comando não existe!');
        return;
    }

    try 
    {   
        await cmd(interaction, client);
    } 

    catch(err) 
    {
        SendConsoleErr("CMD", err);
        await interaction.reply('Não consegui precisar seu comando de interação!');
    }

});

function CMD(name, callback) 
{
    commands[name] = callback;
}

CMD("empresas", async (interaction, client) => 
{
    const userData = await beedb.getValue('employees', 'name', "discord_uid = ?", interaction.user.id);

    let msg = '';

    if(userData.success)
    {
        const compData = await beedb.getRows('companies', 'name', "subscribers = ?", userData.value);
        
        if(compData.success)
        {
            for(const [idx, companie] of compData.companies.entries())
            {
                msg += `\`${idx + 1}.\` ${companie.name}\n`;
            }

            await SendContainerMessage(interaction,
                `**:bee: \u250a LISTA DE __${String(userData.value).toUpperCase()}__**\n\n`,
                interaction.user.displayAvatarURL(),
                0xFF9955,
                msg
            );
        }

        else
        {
            await SendContainerMessage(interaction,
                `### :warning: AVISO\n`,
                BEEA_WARN_URL,
                0xFF5555,
                `\`\`\`Você não possuí empresas cadastradas!\`\`\``
            )
        }
    }

    else
    {
        await SendContainerMessage(interaction,
            `### :red_circle: ERRO\n`,
            BEEA_ERROR_URL,
            0xFF5555,
            `\`\`\`Você não possuí cadastro no banco de dados!\`\`\``
        )
    }
});

CMD("teste", async (interaction, client) => 
{
    const param1 = interaction.options.get('params1').value;
    const param2 = interaction.options.get('params2').value;
    const param3 = interaction.options.get('params3').value;

    SendConsoleLog(Number(param1), param2, param3);

    await interaction.reply("Pronto");
});

client.login(process.env.TOKEN);

async function SendContainerMessage(interaction, title, avatar, color, msg)
{
    try
    {
        const container = new ContainerBuilder({
            
            "accent_color": color,
            "spoiler": false,
            "components": [
            {

                "type": 10,
                "content": title,
            },

            {
                "type": 14,
                "divider": true,
                "spacing": 1
            },
            
            {
                "type": 9,
                "components": [
                    {
                        "type": 10,
                        "content": msg,
                
                    }

                ],
                "accessory": {
                
                    "type": 11,
                    "media": {
                        "url": avatar
                    },
                    "spoiler": false
                } 
            },
        ]})


        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        return true;
    }

    catch(error)
    {
        SendConsoleErr("BEEA", 'Houve um erro inesperado: ' + error);
        return false;
    }
}