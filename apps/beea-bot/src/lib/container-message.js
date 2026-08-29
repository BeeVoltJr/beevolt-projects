import { ContainerBuilder, MessageFlags } from 'discord.js';

export function buildContainer({ title, message, avatar, color }) {
    return new ContainerBuilder({
        accent_color: color,
        spoiler: false,
        components: [
            {
                type: 10,
                content: title
            },
            {
                type: 14,
                divider: true,
                spacing: 1
            },
            {
                type: 9,
                components: [
                    {
                        type: 10,
                        content: message
                    }
                ],
                accessory: {
                    type: 11,
                    media: {
                        url: avatar
                    },
                    spoiler: false
                }
            }
        ]
    });
}

export async function replyWithContainer(interaction, payload) {
    const container = buildContainer(payload);

    return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    });
}

export async function sendChannelContainer(channel, payload) {
    const container = buildContainer(payload);

    return channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    });
}
