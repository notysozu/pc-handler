require("dotenv").config();
const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");

module.exports = new MessageCommand({
    command: {
        name: 'reload',
        description: 'Reload every command.',
        aliases: []
    },
    options: {
        botDevelopers: true
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {Message} message 
     * @param {string[]} args
     */
    run: async (client, message, args) => {
        message = await message.reply({
            content: process.env.MSG_RELOAD_WAIT || '⏳ Please wait...'
        });

        try {
            client.commands_handler.reload();

            // Use env var for development mode toggle
            const isDev = process.env.DEV_ENABLED === "true";
            await client.commands_handler.registerApplicationCommands(isDev);

            await message.edit({
                content: process.env.MSG_RELOAD_SUCCESS || '✅ Successfully reloaded application commands and message commands.'
            });
        } catch (err) {
            await message.edit({
                content: process.env.MSG_RELOAD_FAIL || '❌ Something went wrong.',
                files: [
                    new AttachmentBuilder(Buffer.from(`${err}`, 'utf-8'), { name: 'output.ts' })
                ]
            });
        }
    }
}).toJSON();
