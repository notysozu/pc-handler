require("dotenv").config();
const { ChatInputCommandInteraction, AttachmentBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'reload',
        description: 'Reload every command.',
        type: 1,
        options: []
    },
    options: {
        botDevelopers: true
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply();

        try {
            client.commands_handler.reload();

            // Use env var for dev mode toggle
            const isDev = process.env.DEV_ENABLED === "true";
            await client.commands_handler.registerApplicationCommands(isDev);

            await interaction.editReply({
                content: process.env.MSG_RELOAD_SUCCESS || '✅ Successfully reloaded application commands and message commands.'
            });
        } catch (err) {
            await interaction.editReply({
                content: process.env.MSG_RELOAD_FAIL || '❌ Something went wrong.',
                files: [
                    new AttachmentBuilder(Buffer.from(`${err}`, 'utf-8'), { name: 'output.ts' })
                ]
            });
        }
    }
}).toJSON();
