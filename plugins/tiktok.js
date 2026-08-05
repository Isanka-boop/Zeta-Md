// plugins/ACD_TIKTOK.js — TikTok Downloader Auto + Working Buttons
const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');
const axios = require('axios');
const config = require('../config');

const BOT_NAME = config.BOT_NAME || '𝐙𝐞𝐭𝐚 〽️𝓲𝓷𝓲';
const FOOTER = config.footer || '> ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ';

const TIKTOK_IMG = 'https://files.catbox.moe/chtymz.jpg';
const API_BASE = 'https://whiteshadow-x-api.onrender.com/api/download/tiktok';
const API_TOKEN = 'aWK0z4';

// ── Session store ───────
const tiktokSession = new Map();

function getDateTimeLine() {
    const now = new Date();
    return now.toLocaleString('en-LK', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' });
}

// ── MAIN CMD:.tt url ────────────────────────────────────────────
cmd({
    pattern: "tt",
    alias: ["tiktok", "tik"],
    desc: "Auto TikTok Video Download",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const url = args[0];
        if (!url ||!url.includes("tiktok.com")) {
            return reply(`*❌ Usage:* \`.tt <TikTok URL>\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const { data } = await axios.get(`${API_BASE}?url=${encodeURIComponent(url)}&token=${API_TOKEN}`, { timeout: 20000 });
        if (!data?.status ||!data?.result) throw new Error(data?.message || "API Error");

        const res = data.result;

        // Session එකට save
        tiktokSession.set(m.sender, {
            video: res.video?.noWatermark || res.video?.hd,
            audio: res.music?.play,
            title: res.title,
            thumb: res.cover || TIKTOK_IMG,
            author: res.author,
            stats: res.stats
        });

        // AUTO DOWNLOAD VIDEO
        const videoBuf = await getBuffer(res.video.noWatermark || res.video.hd);

        const caption = `
*╭┈───〔 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 〕┈───⊷*
*├✦ 𝐓𝐢𝐭𝐥𝐞:* *${res.title || "No Title"}*
*├✦ 𝐀𝐮𝐭𝐡𝐨𝐫:* *${res.author?.nickname || "Unknown"}* *@${res.author?.unique_id || ""}*
*├✦ 𝐋𝐢𝐤𝐞𝐬:* *${res.stats?.digg_count?.toLocaleString() || 0}* *𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬:* *${res.stats?.comment_count?.toLocaleString() || 0}*
*├✦ 𝐒𝐡𝐚𝐫𝐞𝐬:* *${res.stats?.share_count?.toLocaleString() || 0}* *𝐕𝐢𝐞𝐰𝐬:* *${res.stats?.play_count?.toLocaleString() || 0}*
*├✦ 𝐃𝐚𝐭𝐞:* *${getDateTimeLine()}*
*╰───────────────────⊷*

*☘ 𝐍𝐨 𝐖𝐚𝐭𝐞𝐫𝐦𝐚𝐫𝐤 • 𝐇𝐃 𝐐𝐮𝐚𝐥𝐢𝐭𝐲*
*☘ 𝐒𝐞𝐥𝐞𝐜𝐭 𝐨𝐩𝐭𝐢𝐨𝐧 𝐛𝐞𝐥𝐨𝐰*
`.trim();

        await conn.sendMessage(from, {
            video: videoBuf,
            caption: caption
        }, { quoted: mek });

        // ── WORKING BUTTONS: List Message ──
        const sections = [
            {
                title: "𝐒𝐞𝐥𝐞𝐜𝐭 𝐀𝐧 𝐎𝐩𝐭𝐢𝐨𝐧",
                rows: [
                    { title: "🎵 Download Audio", description: "Get MP3 of this video", id: "tt_audio" },
                    { title: "📊 Video Info", description: "Get detailed stats", id: "tt_info" },
                    { title: "🔄 Download Again", description: "Send video again", id: "tt_video" }
                ]
            }
        ];

        await conn.sendMessage(from, {
            text: `*𝐕𝐢𝐝𝐞𝐨 𝐒𝐞𝐧𝐭 ✅*\n\n*𝐓𝐢𝐭𝐥𝐞:* ${res.title}\n\n*පහල Button එකෙන් Audio ගන්න*`,
            footer: FOOTER,
            title: "𝐓𝐈𝐊𝐓𝐎𝐊 𝐌𝐄𝐍𝐔",
            buttonText: "𝐂𝐥𝐢𝐜𝐤 𝐇𝐞𝐫𝐞",
            sections
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[TT ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`*❌ දෝෂයක්:* ${e.message}`);
    }
});

// ── BUTTON/LIST HANDLER ───────────────────────────────────────────────
cmd({
    on: "text",
    fromMe: false
}, async (conn, mek, m, { body, sender, reply }) => {
    const session = tiktokSession.get(sender);
    if (!session) return;

    let id = body;
    // List reply එකක් නම්
    if (mek.message?.listResponseMessage) {
        id = mek.message.listResponseMessage.singleSelectReply.selectedRowId;
    }
    // Button reply එකක් නම්
    if (mek.message?.buttonsResponseMessage) {
        id = mek.message.buttonsResponseMessage.selectedButtonId;
    }

    if (id === "tt_audio") {
        try {
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "⏳", key: mek.key } });
            const audioBuf = await getBuffer(session.audio);
            await conn.sendMessage(mek.key.remoteJid, {
                audio: audioBuf,
                mimetype: 'audio/mpeg',
                fileName: `${session.title}.mp3`
            }, { quoted: mek });
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        } catch {
            reply("*❌ Audio Download Error*");
        }
    }

    if (id === "tt_info") {
        const info = `
*╭┈───〔 𝐓𝐈𝐊𝐓𝐎𝐊 𝐕𝐈𝐃𝐄𝐎 𝐈𝐍𝐅𝐎 〕┈───⊷*
*├✦ 𝐓𝐢𝐭𝐥𝐞:* *${session.title}*
*├✦ 𝐀𝐮𝐭𝐡𝐨𝐫:* *${session.author?.nickname}*
*├✦ 𝐋𝐢𝐤𝐞𝐬:* *${session.stats?.digg_count?.toLocaleString()}*
*├✦ 𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬:* *${session.stats?.comment_count?.toLocaleString()}*
*├✦ 𝐒𝐡𝐚𝐫𝐞𝐬:* *${session.stats?.share_count?.toLocaleString()}*
*╰───────────────────⊷*
        `.trim();
        reply(info);
    }

    if (id === "tt_video") {
        const videoBuf = await getBuffer(session.video);
        await conn.sendMessage(mek.key.remoteJid, {
            video: videoBuf,
            caption: `*${session.title}*`
        }, { quoted: mek });
    }
});
