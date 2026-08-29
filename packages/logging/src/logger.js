const BEEA_ERROR_URL = 'https://drive.google.com/uc?export=download&id=1N11iay7wbvTet_AhV6FPybiX8kqf8K8x'
const BEEA_WARN_URL  = 'https://drive.google.com/uc?export=download&id=1Do4Npt3aJICYS09JFgGC70zH5rfM5DYu'
const BEEA_DEBUG_URL = 'https://drive.google.com/uc?export=download&id=1wNikRRHliZMt9Vijc2MBfT0gCCQxMYGa'

import 
{ 
    MessageFlags,
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    MediaGalleryBuilder, 
    MediaGalleryItemBuilder

} from 'discord.js';

export const LOG_TYPE = Object.freeze({

  error: 1,
  warn:  2,
  debug: 3

});

export function SendConsoleLog(logType, tag, msg) 
{
    switch(logType)
    {
        case LOG_TYPE.error:
        {
            SendConsoleErr(tag, msg);
            break;
        }

        case LOG_TYPE.warn:
        {
            SendConsoleWarn(tag, msg);
            break;
        }

        case LOG_TYPE.debug:
        {
            SendConsoleDebug(tag, msg);
            break;
        }
    }
}

export function SendConsoleErr(tag, msg)
{
    const time = new Date().toLocaleTimeString();

    console.log(`(${time}) ERRO: [ ${tag} ] ${msg}\n`);
}

export function SendConsoleWarn(tag, msg)
{
    const time = new Date().toLocaleTimeString();

    console.log(`(${time}) AVISO: [ ${tag} ] ${msg}\n`);
}

export function SendConsoleDebug(tag, msg)
{
    const time = new Date().toLocaleTimeString();

    console.log(`(${time}) DEBUG: [ ${tag} ]:\n\n${msg}\n`);
}

export async function SendDiscordLog(logType, msg)
{
    let log_title, log_color, log_img_url;

    switch(logType)
    {
        case LOG_TYPE.error: 
        {
            log_title   = "### :red_circle: ERRO";
            log_color   = Number("0xFF5555");
            log_img_url = BEEA_ERROR_URL;

            break;
        }
        case LOG_TYPE.warn:
        {
            log_title = "### :warning: AVISO";
            log_color = Number("0xFFFF55");
            log_img_url = BEEA_WARN_URL;

            break;
        }

        case LOG_TYPE.debug:
        {
            log_title   = "### :white_check_mark: DEBUG";
            log_color   = Number("0x55FF55");
            log_img_url = BEEA_DEBUG_URL;

            break;
        }
    }

    const container = new ContainerBuilder({
            
            "accent_color": log_color,
            "spoiler": false,
            "components": [
            {

                "type": 10,
                "content": log_title,
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
                        "url": log_img_url
                    },
                    "spoiler": false
                } 
            },
        ]})

    try
    {
        await fetch(
            "http://localhost:4000/internal/log",
            {
                method: "POST",

                headers:
                {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(container.toJSON())
            }
        );
    }
    catch(error) 
    {
        SendConsoleWarn("LOGS", `Não foi possível enviar o log HTTP: ${error.message}`);
    }
}
