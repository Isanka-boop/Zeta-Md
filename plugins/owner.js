const { cmd } = require('../command');
const config = require('../config'); // OWNER_NUMBER & OWNER_NAME & BOT_NAME
const { getBuffer } = require('../lib/functions');

const OWNER_IMG = 'https://files.catbox.moe/1b8k5v.jpg'; // Owner pic එකක් දාන්න ඕන නම්. නැත්නම් අයින් කරන්න

cmd({
    pattern: "owner",
    alias: ["creator", "dev"],
    react: "👑",
    desc: "Get owner contact info",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const ownerNumber = config.OWNER_NUMBER; // +947xxxxxxxx
        const ownerName = config.OWNER_NAME || "𝐙𝐞𝐭𝐚 𝐎𝐰𝐧𝐞𝐫";
        const botName = config.BOT_NAME || "𝐙𝐞𝐭𝐚-𝐌𝐃";

        // ── VCARD ──
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:${botName};
TEL;type=CELL;type=VOICE;waid=${ownerNumber.replace('+', '')}:${ownerNumber}
END:VCARD`;

        // ── LASSANA BOLD CAPTION ──
        const caption = `
*╭┈───〔 👑 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎 〕┈───⊷*
*├✦ 𝐍𝐚𝐦𝐞:* *𝐈𝐒𝐀𝐍𝐊𝐀*
*├✦ 𝐍𝐮𝐦𝐛𝐞𝐫:* *94763353368*
*├✦ 𝐁𝐨𝐭:* *𝐙𝐄𝐓𝐀 𝐌𝐃*
*├✦ 𝐑𝐨𝐥𝐞:* *𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫 & 𝐎𝐰𝐧𝐞𝐫*
*╰───────────────────⊷*

*🥺 𝐇𝐞𝐥𝐥𝐨 𝐃𝐞𝐚𝐫..*
*𝐈𝐟 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐚𝐧𝐲 𝐩𝐫𝐨𝐛𝐥𝐞𝐦 𝐨𝐫 𝐛𝐮𝐠 𝐫𝐞𝐩𝐨𝐫𝐭* 
*𝐏𝐥𝐞𝐚𝐬𝐞 𝐜𝐨𝐧𝐭𝐚𝐜𝐭 𝐦𝐲 𝐎𝐰𝐧𝐞𝐫* 👇

*⚠️ 𝐃𝐨 𝐧𝐨𝐭 𝐬𝐩𝐚𝐦 𝐦𝐲 𝐎𝐰𝐧𝐞𝐫*
*⚠️ 𝐎𝐧𝐥𝐲 𝐟𝐨𝐫 𝐢𝐦𝐩𝐨𝐫𝐭𝐚𝐧𝐭 𝐰𝐨𝐫𝐤*

> *© 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 ${botName}*
`.trim();

        await conn.sendMessage(from, { react: { text: "👑", key: mek.key } });

        // Image + Caption + Contact ekka yawanna
        const imgBuf = await getBuffer(OWNER_IMG).catch(() => null);

        await conn.sendMessage(from, {
            [imgBuf ? 'image' : 'text']: imgBuf || caption,
            ...(imgBuf && { caption: caption, mimetype: 'image/jpeg' }),
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: mek });

        // ── BUTTONS ──
        const sections = [{
            title: "𝐂𝐨𝐧𝐭𝐚𝐜𝐭 𝐎𝐩𝐭𝐢𝐨𝐧𝐬",
            rows: [
                { title: "📞 Call Owner", description: "Tap to call", id: "owner_call" },
                { title: "💬 Chat Owner", description: "Open chat", id: "owner_chat" }
            ]
        }];

        await conn.sendMessage(from, {
            text: `*𝐒𝐚𝐯𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐧𝐭𝐚𝐜𝐭 ✅*\n\n*𝐍𝐞𝐝 𝐡𝐞𝐥𝐩? 𝐔𝐬𝐞 𝐛𝐞𝐥𝐨𝐰 𝐛𝐮𝐭𝐨𝐧*`,
            footer: `> ${botName}`,
            title: "𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐍𝐔",
            buttonText: "𝐂𝐥𝐢𝐜𝐤 𝐇𝐞𝐫𝐞",
            sections
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply(`*❌ An error occurred:* ${error.message}`);
    }
});

// ── BUTTON HANDLER ──
cmd({
    on: "text",
    fromMe: false
}, async (conn, mek, m, { sender }) => {
    const ownerNumber = config.OWNER_NUMBER;
    
    let id = null;
    if (mek.message?.listResponseMessage) {
        id = mek.message.listResponseMessage.singleSelectReply.selectedRowId;
    }

    if (id === "owner_chat") {
        await conn.sendMessage(sender, { 
            text: `*📞 Owner Number:* 94763353368\n\n*Click here to chat:* wa.me/${ownerNumber.replace('+', '')}` 
        });
    }
    
    if (id === "owner_call") {
        await conn.sendMessage(sender, { 
            text: `*📞 Owner Number:* 94763353368\n\n*Save this number and call*` 
        });
    }
});
