require("dotenv").config();
const { Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");

// Firebase SDK
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set } = require("firebase/database");

// Firebase config (reuse yours or load from config.js/env)
const firebaseConfig = {
    apiKey: process.env.FIREBASE_apiKey,
    authDomain: process.env.FIREBASE_authDomain,
    databaseURL: process.env.FIREBASE_databaseURL,
    projectId: process.env.FIREBASE_projectId,
    storageBucket: process.env.FIREBASE_storageBucket,
    messagingSenderId: process.env.FIREBASE_messagingSenderId,
    appId: process.env.FIREBASE_appId
};

// Initialize Firebase (only once)
const appFB = initializeApp(firebaseConfig);
const db = getDatabase(appFB);

module.exports = new MessageCommand({
    command: {
        name: 'runtask',
        description: 'Sends a new task/command to Firebase for Python app to execute',
        aliases: ['rt']
    },
    options: {
        cooldown: 5000
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {Message} message 
     * @param {string[]} args
     */
    run: async (client, message, args) => {
        if (!args.length) {
            return message.reply({
                content: "⚠️ Please provide a task/command.\nExample: `!runtask ping`"
            });
        }

        const task = args.join(" ");

        try {
            // Save task into Firebase under path `pc/command`
            const taskRef = ref(db, "pc/command");
            await set(taskRef, {
                command: task,
                status: "pending",
                timestamp: Date.now()
            });

            await message.reply({
                content: `✅ Task **${task}** has been sent to Firebase and is now pending execution.`
            });
        } catch (err) {
            console.error(err);
            await message.reply({
                content: "❌ Failed to send task to Firebase."
            });
        }
    }
}).toJSON();
