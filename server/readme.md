# Node.js Application Documentation

## 📌 Overview
The **Node.js server** acts as the **control layer** of the system.  
It interacts with the user (via Discord, commands, or buttons), updates the database with requests, and polls the database periodically for responses from the Python application.  

This ensures smooth communication between the **user interface (Node.js/Discord)** and the **execution layer (Python)**.

---

## ⚡ Responsibilities
- **Receive User Interaction**  
  Handles button clicks, commands, or Discord events and converts them into database updates.

- **Database Polling**  
  Checks the database every **5 seconds** for new outputs/changes.  
  Compares the newly received data with the previous one.

- **Display Outputs/Logs**  
  Sends the updated results to a designated **logs channel** in Discord.  
  Allows further processing or decryption by the user.

---

## 🔄 Workflow
1. **User Interaction**  
   - A command or button press triggers the Node.js server.  
   - Example: `/runtask <TASK>` → Node.js writes `"<TASK>": "pending"` to the database.

2. **Database Update**  
   - Node.js updates the Firebase/Firestore/Discord DB entry with request data.

3. **Polling Cycle (every 5 seconds)**  
   - Node.js checks the database for changes in response/output fields.  
   - If output differs from the previous state, it logs the new output.

4. **Display Logs**  
   - Node.js posts results to a separate Discord channel for further review.

---

## 🌐 Network Behavior
**Outgoing:**
- Sends commands/interaction data to the database.  
- Posts updates to Discord logs channel.  

**Incoming:**
- Receives updates from the database (responses from Python application).  

---

## 🛠️ Example Pseudocode
```js
// Poll the database every 5 seconds
setInterval(() => {
   let dbOutput = checkDatabase("output");

   if (dbOutput !== lastOutput) {
      sendToDiscordLogs(dbOutput);
      lastOutput = dbOutput;
   }
}, 5000);

// Handle user interactions (buttons/commands)
onUserCommand((command) => {
   updateDatabase("task", command);
});
