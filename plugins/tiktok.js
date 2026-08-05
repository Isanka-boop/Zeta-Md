// plugins/ACD_TIKTOK.js — TikTok Downloader (WhiteShadow API + Buttons)
const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');
const axios = require('axios');
const config = require('../config');

const FOOTER = config.footer || '> ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ';
const TIKTOK_IMG = 'https://files.catbox.moe/chtymz.jpg';
const BOT_NAME = config.BOT_NAME || '𝐙𝐞𝐭𝐚 〽️𝓲𝓷𝓲';

// ── Session store ───────
const tiktokSession = new Map();

function getDateTimeLine() {
    const now = new Date();
    return now.toLocaleString('en-LK', { 
        timeZone: 'Asia/Colombo', 
        dateStyle: 'medium', 
        timeStyle: 'short' 
    });
}

// ── WhiteShadow API Fetcher ───────
async function getTTData(url) {
    const apiUrl = `https://whiteshadow-x-api.onrender.com/api/download/tiktok?url=${encodeURIComponent(url)}&apitoken=aWK0z4`;

    const { data } = await axios.get(apiUrl, {
        timeout: 30000
    });

    const res = data.result;

    // ⚠️ API එකේ code -1 නම් එන error එක එහෙමම throw කරනවා
    if (res.code === -1 || !res.video) {
        throw new Error(res.msg || "URL parsing failed. නිවැරදි TikTok link එකක් භාවිතා කරන්න.");
    }

    // WhiteShadow API response එක standard format එකට map කරනවා
    return {
        title: res.title || "No Title",
        author: {
            nickname: res.author?.nickname || res.author?.name || "Unknown",
            unique_id: res.author?.unique_id || res.author?.id || ""
        },
        stats: {
            digg_count: res.statistics?.digg_count || res.stats?.likes || 0,
            comment_count: res.statistics?.comment_count || res.stats?.comments || 0,
            share_count: res.statistics?.share_count || res.stats?.shares || 0,
            play_count: res.statistics?.play_count || res.stats?.views || 0
        },
        video: {
            noWatermark: res.video?.noWatermark || res.video?.nowm || null,
            hd: res.video?.hd || res.video?.hdplay || null,
            wm: res.video?.watermark || res.video?.wm || null
        },
        music: {
            play: res.music || res.audio || null
        },
        cover: res.cover || res.origin_cover || TIKTOK_IMG
    };
}

// ── MAIN CMD ────────────────────────────────────────────
cmd({
    pattern: "tt",
    alias: ["tiktok", "tik"],
    desc: "Download TikTok Videos",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const url = args[0];
        
        if (!url || !url.includes("tiktok.com")) {
            return reply(`*❌ වැරදි භාවිතය!*\n\n*නිවැරදි විදිහ:* \`.tt <TikTok URL>\`\n\n*උදාහරණ:* \`.tt https://vm.tiktok.com/ZMxxxxxxx/\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const res = await getTTData(url);

        if (!res.video?.noWatermark && !res.video?.hd) {
            throw new Error("Video URL හමු නොවීය");
        }

        // Save to session
        const sessionId = m.key.id;
        tiktokSession.set(sessionId, {
            video: res.video.hd || res.video.noWatermark,
            videoNW: res.video.noWatermark,
            audio: res.music?.play,
            title: res.title,
            thumb: res.cover,
            author: res.author,
            stats: res.stats,
            sender: m.sender
        });

        // Get video buffer
        const videoUrl = res.video.hd || res.video.noWatermark;
        const videoBuf = await getBuffer(videoUrl);

        if (!videoBuf || videoBuf.length < 1000) {
            throw new Error("Video Download අසාර්ථක විය");
        }

        const caption = `
╭━━━〔 *𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* 〕━━━╮
┃
┃ 📌 *Title:* ${res.title}
┃
┃ 👤 *Author:* ${res.author.nickname}
┃ 🆔 *Username:* @${res.author.unique_id}
┃
┃ ❤️ *Likes:* ${res.stats.digg_count.toLocaleString()}
┃ 💬 *Comments:* ${res.stats.comment_count.toLocaleString()}
┃ 🔄 *Shares:* ${res.stats.share_count.toLocaleString()}
┃ ▶️ *Views:* ${res.stats.play_count.toLocaleString()}
┃
┃ 📅 *Downloaded:* ${getDateTimeLine()}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

✅ *No Watermark • HD Quality*
`.trim();

        await conn.sendMessage(from, {
            video: videoBuf,
            caption: caption,
            mimetype: 'video/mp4'
        }, { quoted: mek });

        // ── LIST BUTTONS ──
        const sections = [
            {
                title: "🎬 𝐓𝐈𝐊𝐓𝐎𝐊 𝐎𝐏𝐓𝐈𝐎𝐍𝐒",
                rows: [
                    {
                        title: "🎵 Audio Download (MP3)",
                        description: "Song/Audio එක බාගන්න",
                        rowId: `ttaudio_${sessionId}`
                    },
                    {
                        title: "📹 No Watermark Video",
                        description: "Watermark නැති Video එක නැවත බාගන්න",
                        rowId: `ttvideonw_${sessionId}`
                    },
                    {
                        title: "📊 Full Video Info",
                        description: "සම්පූර්ණ Information බලන්න",
                        rowId: `ttinfo_${sessionId}`
                    }
                ]
            },
            {
                title: "⚡ 𝐐𝐔𝐈𝐂𝐊 𝐀𝐂𝐂𝐄𝐒𝐒",
                rows: [
                    {
                        title: "📋 Bot Menu",
                        description: "සියලු Commands ලැයිස්තුව බලන්න",
                        rowId: `ttmenu_${sessionId}`
                    },
                    {
                        title: "🏓 Bot Ping",
                        description: "Bot Speed පරීක්ෂා කරන්න",
                        rowId: `ttping_${sessionId}`
                    }
                ]
            }
        ];

        const listMsg = {
            text: `*✅ Video එක යවන ලදි!*\n\n📝 *${res.title}*\n\nපහතින් Options බලන්න 👇`,
            footer: FOOTER,
            buttonText: "𝐕𝐢𝐞𝐰 𝐎𝐩𝐭𝐢𝐨𝐧𝐬",
            sections
        };

        await conn.sendMessage(from, listMsg, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[TT ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`*❌ Error:* ${e.message}`);
    }
});

// ── BUTTON HANDLER ───────────────────────────────────────────────
cmd({
    on: "text",
    fromMe: false,
    dontAddCommandList: true
}, async (conn, mek, m, { from, reply }) => {
    try {
        let selectedId = null;

        if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
            selectedId = mek.message.listResponseMessage.singleSelectReply.selectedRowId;
        } else if (mek.message?.buttonsResponseMessage?.selectedButtonId) {
            selectedId = mek.message.buttonsResponseMessage.selectedButtonId;
        }

        if (!selectedId) return;

        let action, sessionId;

        if (selectedId.startsWith("ttaudio_")) {
            action = "audio"; sessionId = selectedId.replace("ttaudio_", "");
        } else if (selectedId.startsWith("ttvideonw_")) {
            action = "videonw"; sessionId = selectedId.replace("ttvideonw_", "");
        } else if (selectedId.startsWith("ttinfo_")) {
            action = "info"; sessionId = selectedId.replace("ttinfo_", "");
        } else if (selectedId.startsWith("ttmenu_")) {
            action = "menu"; sessionId = selectedId.replace("ttmenu_", "");
        } else if (selectedId.startsWith("ttping_")) {
            action = "ping"; sessionId = selectedId.replace("ttping_", "");
        } else {
            return;
        }

        // ── MENU BUTTON ──
        if (action === "menu") {
            await conn.sendMessage(from, { react: { text: "📋", key: mek.key } });
            const menuText = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃     *${BOT_NAME}*
┃     *Command Menu*
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯

*📜 MAIN COMMANDS*
┃ ⚡ .ping    → Bot Speed
┃ 📋 .menu    → This Menu
┃ 👤 .owner   → Owner Info
┃ 🔄 .alive   → Bot Status

*📥 DOWNLOADER*
┃ 🎬 .tt      → TikTok Video
┃ 🎵 .song    → Song Download
┃ 🖼️ .img     → Image Search

*🔍 SEARCH*
┃ 🔎 .google  → Google Search
┃ 📰 .news    → Latest News

╰━━━━━━━━━━━━━━━━━━━━━━━━━╯
> *Powered by ${BOT_NAME}*
`.trim();
            await conn.sendMessage(from, { image: { url: TIKTOK_IMG }, caption: menuText }, { quoted: mek });
            return;
        }

        // ── PING BUTTON ──
        if (action === "ping") {
            await conn.sendMessage(from, { react: { text: "🏓", key: mek.key } });
            const start = Date.now();
            await new Promise(r => setTimeout(r, 100));
            const ping = Date.now() - start;
            const pingMsg = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃        *🏓 PONG!*
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯

*⚡ Latency:* _${ping}ms_
*🤖 Bot:* _${BOT_NAME}_
*📅 Time:* _${getDateTimeLine()}_

> *${ping < 100 ? "🟢 Fast" : ping < 300 ? "🟡 Medium" : "🔴 Slow"} Connection*
`.trim();
            await conn.sendMessage(from, { text: pingMsg }, { quoted: mek });
            return;
        }

        // ── TIKTOK ACTIONS (need session) ──
        const session = tiktokSession.get(sessionId);
        if (!session) {
            return reply("*❌ Session expired. නැවත \`.tt\` command එක run කරන්න.*");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        if (action === "audio") {
            if (!session.audio) return reply("*❌ Audio එක හමු නොවීය*");
            const audioBuf = await getBuffer(session.audio);
            if (!audioBuf || audioBuf.length < 1000) throw new Error("Audio Download Failed");
            await conn.sendMessage(from, { audio: audioBuf, mimetype: 'audio/mpeg', fileName: `${session.title}.mp3` }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "🎵", key: mek.key } });
        }

        if (action === "videonw") {
            if (!session.videoNW) return reply("*❌ Video URL නැත*");
            const videoBuf = await getBuffer(session.videoNW);
            await conn.sendMessage(from, { video: videoBuf, mimetype: 'video/mp4', caption: `*✅ No Watermark Video*\n\n📝 ${session.title}` }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "📹", key: mek.key } });
        }

        if (action === "info") {
            const info = `
╭━━━〔 *𝐕𝐈𝐃𝐄𝐎 𝐈𝐍𝐅𝐎* 〕━━━╮
┃
┃ 📌 *Title:* ${session.title}
┃
┃ 👤 *Author:* ${session.author?.nickname || "Unknown"}
┃ 🆔 *Username:* @${session.author?.unique_id || "N/A"}
┃
┃ ❤️ *Likes:* ${session.stats?.digg_count?.toLocaleString() || "0"}
┃ 💬 *Comments:* ${session.stats?.comment_count?.toLocaleString() || "0"}
┃ 🔄 *Shares:* ${session.stats?.share_count?.toLocaleString() || "0"}
┃ ▶️ *Views:* ${session.stats?.play_count?.toLocaleString() || "0"}
┃
┃ 🎵 *Audio:* ${session.audio ? "✅ Available" : "❌ N/A"}
┃ 📹 *HD Video:* ${session.video ? "✅ Available" : "❌ N/A"}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`.trim();
            await conn.sendMessage(from, { image: { url: session.thumb || TIKTOK_IMG }, caption: info }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "📊", key: mek.key } });
        }

    } catch (e) {
        console.error("[TT BTN ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`*❌ Error:* ${e.message}`);
    }
});
