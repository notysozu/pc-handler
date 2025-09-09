const { Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");

// ✅ Firebase SDK
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get, child } = require("firebase/database");

// 🔥 Firebase config (replace with yours or load from process.env ideally)
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

// ✅ Helper function: format objects recursively
function formatData(data, indent = 0) {
    if (typeof data !== "object" || data === null) {
        return JSON.stringify(data); // string/number/bool/null
    }

    let result = "";
    const pad = " ".repeat(indent);

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === "object" && value !== null) {
            result += `${pad}${key}:\n${formatData(value, indent + 2)}\n`;
        } else {
            result += `${pad}${key}: ${JSON.stringify(value)}\n`;
        }
    }
    return result.trim();
}

module.exports = new MessageCommand({
    command: {
        name: "checkstatus",
        description: "Checks current status/command from Firebase Realtime Database",
        aliases: ["h"]
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
                const data = snapshot.val();
                const formatted = formatData(data);

                await message.reply({
                    content: `📌 Current status in DB:\n\`\`\`yaml\n${formatted}\n\`\`\``
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
