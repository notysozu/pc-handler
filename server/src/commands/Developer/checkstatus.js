const { Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");

// ✅ Firebase SDK
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get, child } = require("firebase/database");

// 🔥 Firebase config (replace with yours or load from config.js/env)
const firebaseConfig = {
    apiKey: "AIzaSyAPZqFyVo9KH7TDVxYBzwBCYqLPTWSXVNY",
    authDomain: "pc-handler.firebaseapp.com",
    databaseURL: "https://pc-handler-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pc-handler",
    storageBucket: "pc-handler.firebasestorage.app",
    messagingSenderId: "139443658220",
    appId: "1:139443658220:web:e7520bf27e523e1df134c9"
};

// Initialize Firebase (only once)
const appFB = initializeApp(firebaseConfig);
const db = getDatabase(appFB);

module.exports = new MessageCommand({
    command: {
        name: 'checkstatus',
        description: 'Checks current status/command from Firebase Realtime Database',
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
        try {
            const snapshot = await get(child(ref(db), "pc/command"));
            if (snapshot.exists()) {
                await message.reply({
                    content: `📌 Current status in DB: **${snapshot.val()}**`
                });
            } else {
                await message.reply({
                    content: "⚠️ No status found in Firebase database."
                });
            }
        } catch (err) {
            console.error(err);
            await message.reply({
                content: "❌ Error retrieving status from Firebase."
            });
        }
    }
}).toJSON();
