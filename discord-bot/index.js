const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database('../crm/scriptfiles/beedb.db');

require('dotenv').config();

const 
{ 
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder

} = require('discord.js');

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

client.once(Events.ClientReady, (client) => 
{
        console.log(`Bot online: ${client.user.tag}`);
}
);

client.on('messageCreate', async (message) => 
{
    if(message.author.bot) return;

    const prefix = '!';

    if(!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);

    const command = args.shift().toLowerCase();

    if(command === 'teste')
    {

    }
}
);

client.login(process.env.TOKEN);