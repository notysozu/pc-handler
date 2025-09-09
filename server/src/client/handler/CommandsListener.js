const { PermissionsBitField, ChannelType } = require("discord.js");
const DiscordBot = require("../DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const { handleMessageCommandOptions, handleApplicationCommandOptions } = require("./CommandOptions");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { error } = require("../../utils/Console");

// ✅ Load environment variables
require("dotenv").config();

class CommandsListener {
    /**
     * @param {DiscordBot} client 
     */
    constructor(client) {
        client.on("messageCreate", async (message) => {
            if (message.author.bot || message.channel.type === ChannelType.DM) return;

            if (process.env.ENABLE_MESSAGE_COMMANDS !== "true") return;

            let prefix = process.env.COMMANDS_PREFIX || "!";

            if (client.database.has("prefix-" + message.guild.id)) {
                prefix = client.database.get("prefix-" + message.guild.id);
            }

            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/\s+/g);
            const commandInput = args.shift().toLowerCase();

            if (!commandInput.length) return;

            /**
             * @type {MessageCommand['data']}
             */
            const command =
                client.collection.message_commands.get(commandInput) ||
                client.collection.message_commands.get(client.collection.message_commands_aliases.get(commandInput));

            if (!command) return;

            try {
                if (command.options) {
                    const commandContinue = await handleMessageCommandOptions(message, command.options, command.command);
                    if (!commandContinue) return;
                }

                if (
                    command.command?.permissions &&
                    !message.member.permissions.has(PermissionsBitField.resolve(command.command.permissions))
                ) {
                    await message.reply({
                        content: process.env.MSG_MISSING_PERMISSIONS || "Missing permissions!",
                        ephemeral: true,
                    });
                    return;
                }

                command.run(client, message, args);
            } catch (err) {
                error(err);
            }
        });

        client.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) return;

            if (process.env.ENABLE_CHAT_INPUT_COMMANDS !== "true" && interaction.isChatInputCommand()) return;
            if (process.env.ENABLE_USER_CONTEXT_COMMANDS !== "true" && interaction.isUserContextMenuCommand()) return;
            if (process.env.ENABLE_MESSAGE_CONTEXT_COMMANDS !== "true" && interaction.isMessageContextMenuCommand()) return;

            /**
             * @type {ApplicationCommand['data']}
             */
            const command = client.collection.application_commands.get(interaction.commandName);

            if (!command) return;

            try {
                if (command.options) {
                    const commandContinue = await handleApplicationCommandOptions(interaction, command.options, command.command);
                    if (!commandContinue) return;
                }

                command.run(client, interaction);
            } catch (err) {
                error(err);
            }
        });
    }
}

module.exports = CommandsListener;
