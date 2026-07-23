import express              from 'express';
import sqlite3Package       from 'sqlite3';
import cors                 from 'cors';
import fs                   from 'fs';
import path                 from 'path';
import dotenv               from 'dotenv';
import puppeteer            from 'puppeteer';
import { fileURLToPath }    from 'url';

import 
{ 
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
    AttachmentBuilder

} from 'discord.js';

const sqlite3 = sqlite3Package.verbose();

const commands = {};

const db = new sqlite3.Database("./database/beedb.db");

const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '.env') });

const embedlog = JSON.parse(fs.readFileSync(path.join(__dirname, 'embed-log.json'), 'utf-8'));

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
    console.log(`\nBot online: ${readyClient.user.tag}`);

    app.get("/health", (req, res) => {
        res.sendStatus(200);
    });

    app.post("/internal/log", async (req, res) =>
    {
        try
        {
            const channel = await readyClient.channels.fetch("1529939818199519242");

            const tmp_embed = JSON.parse(JSON.stringify(embedlog));

            tmp_embed.title             = `${tmp_embed.title}${req.body.title}`;
            tmp_embed.color             = req.body.color;
            tmp_embed.description       = req.body.msg;
            tmp_embed.fields[0].value   = req.body.sysname;
            tmp_embed.fields[1].value   = req.body.date;
          
            const Embed = EmbedBuilder.from(tmp_embed);

            await channel.send({ embeds: [Embed] });
    
            res.sendStatus(200);
        }

        catch(err)
        {
            console.error("Erro na rota internal/log:", err);
            console.error(err);
            res.sendStatus(500);
        }
    });

    app.listen(4000, async() => {});
});

client.on('messageCreate', async (message) => 
{
    if(message.author.bot) return;

    const prefix = '!';

    if(!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);

    const command = args.shift().toLowerCase();

    const cmd = commands[command];

    if(!cmd) 
    {
        await message.reply('Comando inexistente.');
        return;
    }

    try 
    {   
        await cmd(message, client, ...args);
    } 

    catch(err) 
    {
        console.error(err);

        await message.reply('Erro ao executar comando.');
    }
});

function CMD(name, callback) 
{
    commands[name] = callback;
}

CMD("teste", async (message, client, parms0, params1, params2) => 
{

});


async function SendSystemLog(log_sysname, log_type, log_msg)
{
    let log_title, log_color;

    switch(log_type)
    {
        case "ERROR": 
        {
            log_title = "ERRO";
            log_color = Number("0xFF5555");
            break;
        }
        case "WARN":
        {
            log_title = "AVISO";
            log_color = Number("0xFFFF55");
            break;
        }

        case "DEBUG":
        {
            log_title = "DEBUG";
            log_color = Number("0x55FF55");
            break;
        }
    }

    await fetch(
        "http://localhost:4000/internal/log",
        {
            method: "POST",
            headers:
            {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({

                title:      log_title,
                color:      log_color,
                sysname:    `\`\`\`${log_sysname}\`\`\``,
                msg:        `${log_msg}`,
                date:       `\`\`\`${new Date().toLocaleString()}\`\`\``
            })
        }
    );
}

// app.use((req, res, next) =>
// {
//     console.log(`\nBOT [${new Date().toISOString()}] ${req.method} ${req.url}`);

//     if(req.method === "POST" || req.method === "PUT")
//         console.log("data: ", req.body);
    
//     next();
// });


client.login(process.env.TOKEN);