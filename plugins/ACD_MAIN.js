// plugins/ACD_MAIN.js — Main Commands with Premium UI Footer & Custom Image Support
const { cmd, commands } = require('../command');
const { getBuffer } = require('../lib/functions');

// ── Image Configurations (Consistent with ACD_MENU and ACD_VV styling) ──
const MAIN_IMAGES = {
  ping:    'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ', // Ping/Pong command interface image
  info:    'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ', // Bot info presentation image
  error:   'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ', // Error fallback image
  other:   'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ'  // Default fallback
};

// ── Hardcoded UI Brand Elements (Directly matching ACD_MENU.js) ──
const BOT_NAME    = 'ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲';
const BOT_VERSION = 'v3.0';
const OWNER_NAME  = 'ᴢᴇᴛᴀ∇';

// ── Global Footer Content ────────────────────────────────────────
const GLOBAL_FOOTER = `\n╭─────𓆩★𓆪──────╮\n> ㋛ 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐈𝐒𝐀𝐍𝐊𝐀 \n╰─────𓆩★𓆪──────╯`;

// ══════════════════════════════════════════════════════════════════
// PING COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
    pattern: "ping",
    desc: "Check bot response time.",
    category: "main",
    react: "🏓",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const start = Date.now();
        
        // Initial premium latency testing layout
        let testingText = `╭────「 🏓 PING 」\n│ ⏳ _Testing response speed..._\n╰───────────────────\n` + GLOBAL_FOOTER;
        let testMsg;
        
        try {
            const imgBuf = await getBuffer(MAIN_IMAGES['']);
            testMsg = await conn.sendMessage(from, { image: imgBuf, caption: testingText }, { quoted: mek });
        } catch {
            testMsg = await reply(testingText);
        }
        
        const ping = Date.now() - start;
        
        // Finalized Pong performance block matching your unique system frames
        let text = `╭━━━〔𝐏𝐎𝐍𝐆 𝐒𝐏𝐄𝐄𝐃〕━✦\n`;
        text += `├───────────\n`;
        text += `│  📍 \`Latency\`  : ${ping}ms\n`;
        text += `│  ⚡ \`Status\`   : Supercharged\n`;
        text += `│  🫵 *අප හා සම්බන්ධ වී සිටින ඔබට බොහොම ස්තූතියි 🦋*   : Supercharged\n`;
        text += `╰────────────╯\n`;
        text += GLOBAL_FOOTER;

        // Clean up initial test layout and push final performance status

        try {
            const imgBuf = await getBuffer(MAIN_IMAGES['']);
            await conn.sendMessage(from, {
                image: imgBuf,
                caption: text,
                mimetype: 'image/jpeg'
            }, { quoted: mek });
        } catch {
            await reply(text);
        }
    } catch (e) { 
        console.error('[PING ERROR]', e);
        reply(`❌ Error: ${e.message}`); 
    }
});

// ══════════════════════════════════════════════════════════════════
// BOTINFO COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
    pattern: "botinfo",
    alias: ["info"],
    desc: "Show bot information.",
    category: "main",
    react: "ℹ️",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const total = commands.filter(c => c.pattern && !c.dontAddCommandList).length;
        const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        
        let text = `╭━━━〔𝐁𝐎𝐓 𝐈𝐍𝐅𝐎〕━✦\n`;
        text += `├───────────\n`;
        text += `│  👾 \`Name\`     : ${BOT_NAME}\n`;
        text += `│  🔖 \`Version\`  : ${BOT_VERSION}\n`;
        text += `│  📞 \`Owner\`    : ${OWNER_NAME}\n`;
        text += `│  📦 \`Cmds\`     : ${total}\n`;
        text += `│  ⚡ \`Runtime\`  : Node.js ${process.version}\n`;
        text += `│  🧠 \`RAM\`      : ${usedMemory} MB\n`;
        text += `│  🥷 \`𝗢𝘄𝗻𝗲𝗿 : ɪꜱᴀɴᴋᴀ\`      : \n`;
        text += `╰────────────╯\n`;
        text += GLOBAL_FOOTER;

        try {
            const imgBuf = await getBuffer(MAIN_IMAGES['']);
            await conn.sendMessage(from, {
                image: imgBuf,
                caption: text,
                mimetype: 'image/jpeg'
            }, { quoted: mek });
        } catch {
            reply(text);
        }
    } catch (e) { 
        console.error('[BOTINFO ERROR]', e);
        reply(`❌ Error: ${e.message}`); 
    }
});
