// plugins/ACD_TIKTOK.js — TikTok Downloader + Menu & Ping Buttons
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

// ── TikWM API (POST required) ───────
async function getTTDataFromTikWM(url) {
    const formData = new URLSearchParams();
    formData.append('url', url);
    formData.append('hd', '1');

    const { data } = await axios.post('https://api.tikwm.com/video/', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
    });

    if (data.code === 0 && data.data) {
        const d = data.data;
        return {
            title: d.title || "No Title",
            author: {
                nickname: d.author?.nickname || "Unknown",
                unique_id: d.author?.unique_id || ""
            },
            stats: {
                digg_count: d.digg_count || 0,
                comment_count: d.comment_count || 0,
                share_count: d.share_count || 0,
                play_count: d.play_count || 0
            },
            video: {
                noWatermark: d.play ? `https://www.tikwm.com${d.play}` : null,
                hd: d.hdplay ? `https://www.tikwm.com${d.hdplay}` : null,
                wm: d.wmplay ? `https://www.tikwm.com${d.wmplay}` : null
            },
            music: {
                play: d.music ? `https://www.tikwm.com${d.music}` : null
            },
            cover: d.cover ? `https://www.tikwm.com${d.cover}` : TIKTOK_IMG
        };
    }
    throw new Error(data.msg || "TikWM API Error");
}

// ── Main Data Fetcher ───────
async function getTTData(url) {
    try {
        return await getTTDataFromTikWM(url);
    } catch (e) {
        console.log("[TT] TikWM Failed:", e.message);
    }
    throw new Error("❌ API අසාර්ථක විය. පසුව නැවත උත්සාහ කරන්න.");
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

        // ── LIST BUTTONS (TikTok + Menu + Ping) ──
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

        // List Response
        if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
            selectedId = mek.message.listResponseMessage.singleSelectReply.selectedRowId;
        }
        // Button Response
        else if (mek.message?.buttonsResponseMessage?.selectedButtonId) {
            selectedId = mek.message.buttonsResponseMessage.selectedButtonId;
        }

        if (!selectedId) return;

        let action, sessionId;

        if (selectedId.startsWith("ttaudio_")) {
            action = "audio";
            sessionId = selectedId.replace("ttaudio_", "");
        } else if (selectedId.startsWith("ttvideonw_")) {
            action = "videonw";
            sessionId = selectedId.replace("ttvideonw_", "");
        } else if (selectedId.startsWith("ttinfo_")) {
            action = "info";
            sessionId = selectedId.replace("ttinfo_", "");
        } else if (selectedId.startsWith("ttmenu_")) {
            action = "menu";
            sessionId = selectedId.replace("ttmenu_", "");
        } else if (selectedId.startsWith("ttping_")) {
            action = "ping";
            sessionId = selectedId.replace("ttping_", "");
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
┃ ℹ️ .info    → Bot Info

*📥 DOWNLOADER*
┃ 🎬 .tt      → TikTok Video
┃ 🎵 .song    → Song Download
┃ 🖼️ .img     → Image Search

*🔍 SEARCH*
┃ 🔎 .google  → Google Search
┃ 📰 .news    → Latest News

*🎮 FUN*
┃ 😂 .joke    → Random Joke
┃ 🎲 .quote   → Random Quote

╰━━━━━━━━━━━━━━━━━━━━━━━━━╯
> *Powered by ${BOT_NAME}*
`.trim();

            await conn.sendMessage(from, {
                image: { url: TIKTOK_IMG },
                caption: menuText
            }, { quoted: mek });

            return;
        }

        // ── PING BUTTON ──
        if (action === "ping") {
            await conn.sendMessage(from, { react: { text: "🏓", key: mek.key } });

            const start = Date.now();
            await new Promise(r => setTimeout(r, 100));
            const end = Date.now();
            const ping = end - start;

            const pingMsg = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃        *🏓 PONG!*
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯

*⚡ Latency:* _${ping}ms_
*🤖 Bot:* _${BOT_NAME}_
*📅 Time:* _${getDateTimeLine()}_

> *${ping < 100 ? "🟢 Fast" : ping < 300 ? "🟡 Medium" : "🔴 Slow"} Connection*
`.trim();

            await conn.sendMessage(from, {
                text: pingMsg
            }, { quoted: mek });

            return;
        }

        // ── TIKTOK ACTIONS (need session) ──
        const session = tiktokSession.get(sessionId);
        if (!session) {
            return reply("*❌ Session expired. නැවත \`.tt\` command එක run කරන්න.*");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // AUDIO DOWNLOAD
        if (action === "audio") {
            if (!session.audio) {
                return reply("*❌ Audio එක හමු නොවීය*");
            }
            
            const audioBuf = await getBuffer(session.audio);
            if (!audioBuf || audioBuf.length < 1000) {
                throw new Error("Audio Download Failed");
            }

            await conn.sendMessage(from, {
                audio: audioBuf,
                mimetype: 'audio/mpeg',
                fileName: `${session.title}.mp3`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "🎵", key: mek.key } });
        }

        // NO WATERMARK VIDEO
        if (action === "videonw") {
            if (!session.videoNW) {
                return reply("*❌ Video URL නැත*");
            }

            const videoBuf = await getBuffer(session.videoNW);
            await conn.sendMessage(from, {
                video: videoBuf,
                mimetype: 'video/mp4',
                caption: `*✅ No Watermark Video*\n\n📝 ${session.title}`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "📹", key: mek.key } });
        }

        // INFO
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

            await conn.sendMessage(from, {
                image: { url: session.thumb || TIKTOK_IMG },
                caption: info
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "📊", key: mek.key } });
        }

    } catch (e) {
        console.error("[TT BTN ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`*❌ Error:* ${e.message}`);
    }
});
