require("dotenv").config();
const { Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");

module.exports = new MessageCommand({
    command: {
        name: 'help',
        description: 'Replies with a list of available message commands.',
        aliases: ['h']
    },
    options: {
        cooldown: 10000
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {Message} message 
     * @param {string[]} args
     */
    run: async (client, message, args) => {
        // Fallback prefix if not set in DB
        const defaultPrefix = process.env.COMMAND_PREFIX || "!";

        const replyText = client.collection.message_commands
            .map((cmd) => {
                const prefix = client.database.ensure(`prefix-${message.guild.id}`, defaultPrefix);
                return `\`${prefix}${cmd.command.name}\``;
            })
            .join(", ");

        await message.reply({
            content: replyText || (process.env.MSG_HELP_EMPTY || "⚠️ No commands available.")
        });
    }
}).toJSON();
