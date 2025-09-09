const { Message } = require("discord.js");
const MessageCommand = require("../../structure/MessageCommand");
const ApplicationCommand = require("../../structure/ApplicationCommand");

// Load environment variables
require("dotenv").config();

const application_commands_cooldown = new Map();
const message_commands_cooldown = new Map();

// Helper: get array from env (comma separated values)
const parseEnvArray = (key) => {
    const val = process.env[key];
    return val ? val.split(",").map(v => v.trim()) : [];
};

// Env-based config
const envConfig = {
    users: {
        ownerId: process.env.OWNER_ID,
        developers: parseEnvArray("DEVELOPER_IDS") // example: "123,456,789"
    },
    messages: {
        NOT_BOT_OWNER: process.env.MSG_NOT_BOT_OWNER || "❌ Only the bot owner can use this command.",
        NOT_BOT_DEVELOPER: process.env.MSG_NOT_BOT_DEVELOPER || "❌ Only bot developers can use this command.",
        NOT_GUILD_OWNER: process.env.MSG_NOT_GUILD_OWNER || "❌ Only the server owner can use this command.",
        CHANNEL_NOT_NSFW: process.env.MSG_CHANNEL_NOT_NSFW || "⚠️ This command can only be used in NSFW channels.",
        GUILD_COOLDOWN: process.env.MSG_GUILD_COOLDOWN || "⏳ Please wait %cooldown%s before reusing this command."
    }
};

/**
 * 
 * @param {import("discord.js").Interaction} interaction 
 * @param {ApplicationCommand['data']['options']} options 
 * @param {ApplicationCommand['data']['command']} command 
 * @returns {boolean}
 */
const handleApplicationCommandOptions = async (interaction, options, command) => {
    if (options.botOwner) {
        if (interaction.user.id !== envConfig.users.ownerId) {
            await interaction.reply({
                content: envConfig.messages.NOT_BOT_OWNER,
                ephemeral: true
            });
            return false;
        }
    }

    if (options.botDevelopers) {
        if (envConfig.users.developers.length > 0 && !envConfig.users.developers.includes(interaction.user.id)) {
            await interaction.reply({
                content: envConfig.messages.NOT_BOT_DEVELOPER,
                ephemeral: true
            });
            return false;
        }
    }

    if (options.guildOwner) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            await interaction.reply({
                content: envConfig.messages.NOT_GUILD_OWNER,
                ephemeral: true
            });
            return false;
        }
    }

    if (options.cooldown) {
        const cooldownFunction = () => {
            let data = application_commands_cooldown.get(interaction.user.id) || [];
            data.push(interaction.commandName);
            application_commands_cooldown.set(interaction.user.id, data);

            setTimeout(() => {
                let data = application_commands_cooldown.get(interaction.user.id) || [];
                data = data.filter((v) => v !== interaction.commandName);

                if (data.length <= 0) {
                    application_commands_cooldown.delete(interaction.user.id);
                } else {
                    application_commands_cooldown.set(interaction.user.id, data);
                }
            }, options.cooldown);
        };

        if (application_commands_cooldown.has(interaction.user.id)) {
            let data = application_commands_cooldown.get(interaction.user.id);

            if (data.some((cmd) => cmd === interaction.commandName)) {
                await interaction.reply({
                    content: envConfig.messages.GUILD_COOLDOWN.replace(/%cooldown%/g, options.cooldown / 1000),
                    ephemeral: true
                });
                return false;
            } else {
                cooldownFunction();
            }
        } else {
            application_commands_cooldown.set(interaction.user.id, [interaction.commandName]);
            cooldownFunction();
        }
    }

    return true;
};

/**
 * 
 * @param {Message} message 
 * @param {MessageCommand['data']['options']} options 
 * @param {MessageCommand['data']['command']} command 
 * @returns {boolean}
 */
const handleMessageCommandOptions = async (message, options, command) => {
    if (options.botOwner) {
        if (message.author.id !== envConfig.users.ownerId) {
            await message.reply({
                content: envConfig.messages.NOT_BOT_OWNER
            });
            return false;
        }
    }

    if (options.botDevelopers) {
        if (envConfig.users.developers.length > 0 && !envConfig.users.developers.includes(message.author.id)) {
            await message.reply({
                content: envConfig.messages.NOT_BOT_DEVELOPER
            });
            return false;
        }
    }

    if (options.guildOwner) {
        if (message.author.id !== message.guild.ownerId) {
            await message.reply({
                content: envConfig.messages.NOT_GUILD_OWNER
            });
            return false;
        }
    }

    if (options.nsfw) {
        if (!message.channel.nsfw) {
            await message.reply({
                content: envConfig.messages.CHANNEL_NOT_NSFW
            });
            return false;
        }
    }

    if (options.cooldown) {
        const cooldownFunction = () => {
            let data = message_commands_cooldown.get(message.author.id) || [];
            data.push(command.name);
            message_commands_cooldown.set(message.author.id, data);

            setTimeout(() => {
                let data = message_commands_cooldown.get(message.author.id) || [];
                data = data.filter((cmd) => cmd !== command.name);

                if (data.length <= 0) {
                    message_commands_cooldown.delete(message.author.id);
                } else {
                    message_commands_cooldown.set(message.author.id, data);
                }
            }, options.cooldown);
        };

        if (message_commands_cooldown.has(message.author.id)) {
            let data = message_commands_cooldown.get(message.author.id);

            if (data.some((v) => v === command.name)) {
                await message.reply({
                    content: envConfig.messages.GUILD_COOLDOWN.replace(/%cooldown%/g, options.cooldown / 1000)
                });
                return false;
            } else {
                cooldownFunction();
            }
        } else {
            message_commands_cooldown.set(message.author.id, [command.name]);
            cooldownFunction();
        }
    }

    return true;
};

module.exports = { handleApplicationCommandOptions, handleMessageCommandOptions };
