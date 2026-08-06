const { cmd } = require('../command');
const fs = require('fs-extra');
const path = require('path');

// NOTE: this requires your main server file to `module.exports = { cleanupSession, ... }`.
// If your main file isn't called index.js, change '../index' below to match it.
const { cleanupSession, activeSockets, Session, SESSION_BASE_PATH } = require('../index');

cmd({
    pattern: "delsession",
    alias: ["unpair", "removenumber", "disconnect"],
    desc: "Disconnect a paired number from the bot and delete its saved session",
    category: "owner",
    react: "🗑️",
    filename: __filename
}, async (sock, mek, m, { args, reply, isOwner }) => {
    try {
        if (!isOwner) return reply("❌ Only the bot owner can use this command.");

        const raw = args[0];
        if (!raw) {
            return reply(
                "📌 *Usage:* .delsession <number>\n\n" +
                "Example: .delsession 94712345678"
            );
        }

        const number = raw.replace(/[^0-9]/g, '');
        if (!number) return reply("❌ Invalid number.");

        const sessionId = `dina_${number}`;
        const sessionPath = path.join(SESSION_BASE_PATH, sessionId);

        const isActive = !!activeSockets[sessionId];
        const savedSession = await Session.findOne({ sessionId });

        if (!isActive && !savedSession) {
            return reply(`ℹ️ No active or saved session found for *${number}*.`);
        }

        // Kill any live socket/timers for this number
        cleanupSession(sessionId);

        // Wipe the stored session from MongoDB and disk
        await Session.findOneAndDelete({ sessionId });
        await fs.remove(sessionPath).catch(() => {});

        reply(
            `✅ *Session Removed*\n\n` +
            `📱 Number: ${number}\n` +
            `🔌 Bot disconnected and all session data deleted.`
        );

    } catch (e) {
        console.error('[DELSESSION PLUGIN ERROR]', e);
        reply('❌ Failed to remove session: ' + e.message);
    }
});
