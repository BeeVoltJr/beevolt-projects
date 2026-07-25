import util from 'node:util';
export { beedb, Database } from './src/database.js';

import './src/routes.js'

export async function SendSystemLog(log_sysname, log_type, log_msg)
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
