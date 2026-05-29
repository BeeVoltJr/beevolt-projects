const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database('../crm/scriptfiles/beedb.db');


require('dotenv').config();

const { 
    Client,
    GatewayIntentBits,
    Events
} = require('discord.js');

const client = new Client({
    intents: 
    [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, (c) => {
    console.log(`Bot online: ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'teste') {

        await interaction.reply('Bot funcionando corretamente!');
    }
});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    const prefix = '!';

    if (!message.content.startsWith(prefix)) return;

    const args = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/);

    const command = args.shift().toLowerCase();

    if(command === 'consultar') 
    {
        const [ params ] = args;
        
        let 
            subscriber
        ;

        subscriber = params.replace("_", " ");

        db.all(
            'SELECT name, phone, email, website FROM companys WHERE subscribers = ?', subscriber,
            
            (err, rows) => {

                if(err) {
                    console.log("Erro ao acessar DB");
                    return 0;
                }
                
                if(rows.length === 0)
                {
                    message.reply(`${subscriber} não é possui empresas ou não faz parte da BeeVolt`);
                    return 0;
                }

                let msg = `Empresas de ${subscriber}:\n\n`;

                rows.forEach((company) => {
                    
                    msg += `Empresa: ${company.name}\n`;
                });

                message.reply(msg);
            }
        );

    }
});

client.login(process.env.TOKEN);