// plugins/ACD_TIKTOK.js — TikTok Downloader Auto + Working Buttons
const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');
const axios = require('axios');
const config = require('../config');

const BOT_NAME = config.BOT_NAME || '𝐙𝐞𝐭𝐚 〽️𝓲𝓷𝓲';
const FOOTER = config.footer || '> ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ';

const TIKTOK_IMG = 'https://files.catbox.moe/chtymz.jpg';

// ✅ NEW API - Token නැතුව වැඩ // ⚡ 2 ta API danne. ekak awul unoth anith eken wad
const API_LIST = [
    `https://api.tikwm.com/video/?url=`, // Free, No Token
    `https://api.sasatech.online/api/v1/tiktok/download?url=` // Oyage Key
];
const SASATECH_KEY = "fde2165c3c244df6e5d59790a0ef80a9bff360e9c4ee1c0f";

// ── Session store ───────
const tiktokSession = new Map();

function getDateTimeLine() {
    const now = new Date();
    return now.toLocaleString('en-LK', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' });
}

async function getTTData(url) {
    let lastError;
    // API 2ma try karanawa
    for(const base of API_LIST){
        try{
            let apiUrl = base + encodeURIComponent(url);
            let headers = {};
            
            // Sasatech nam header eka add karanawa
            if(base.includes("sasatech")){
                headers["x-api-key"] = SASATECH_KEY;
            }

            const { data } = await axios.get(apiUrl, { headers, timeout: 15000 });

            // tikwm format
            if(data?.data?.play){
                return {
                    title: data.data.title,
                    author: { nickname: data.data.author.nickname, unique_id: data.data.author.unique_id },
                    stats: { digg_count: data.data.digg_count, comment_count: data.data.comment_count, share_count: data.data.share_count, play_count: data.data.play_count },
                    video: { noWatermark: data.data.play, hd: data.data.wmplay },
                    music: { play: data.data.music.play },
                    cover: data.data.cover
                }
            }
            // sasatech format
            if(data?.status && data?.data){
                return data.data;
            }

        }catch(e){
            lastError = e;
            console.log(`API Failed: ${base}`, e.response?.status);
        }
    }
    throw lastError || new Error("All APIs Failed");
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

        const res = await getTTData(url);

        // Session ekata save
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
*├✦ 𝐋𝐢𝐤𝐞𝐬:* *${res.stats?.digg_count?.toLocaleString() || 0}* 
*├✦ 𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬:* *${res.stats?.comment_count?.toLocaleString() || 0}*
*├✦ 𝐒𝐡𝐚𝐫𝐞𝐬:* *${res.stats?.share_count?.toLocaleString() || 0}*
*├✦ 𝐃𝐚𝐭𝐞:* *${getDateTimeLine()}*
*╰───────────────────⊷*

*☘ 𝐍𝐨 𝐖𝐚𝐭𝐞𝐫𝐦𝐚𝐫𝐤 • 𝐇𝐃 𝐐𝐮𝐚𝐥𝐢𝐭𝐲*
`.trim();

        await conn.sendMessage(from, {
            video: videoBuf,
            caption: caption
        }, { quoted: mek });

        // ── WORKING LIST BUTTONS ──
        const sections = [{
            title: "𝐒𝐞𝐥𝐞𝐜𝐭 𝐀𝐧 𝐎𝐩𝐭𝐢𝐨𝐧",
            rows: [
                { title: "🎵 Download Audio", description: "Get MP3", id: "tt_audio" },
                { title: "📊 Video Info", description: "Get stats", id: "tt_info" }
            ]
        }];

        await conn.sendMessage(from, {
            text: `*𝐕𝐢𝐝𝐞𝐨 𝐒𝐞𝐧𝐭 ✅*\n\n*𝐓𝐢𝐭𝐥𝐞:* ${res.title}`,
            footer: FOOTER,
            title: "𝐓𝐈𝐊𝐓𝐎𝐊 𝐌𝐄𝐍𝐔",
            buttonText: "𝐂𝐥𝐢𝐜𝐤 𝐇𝐞𝐫𝐞",
            sections
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[TT ERROR]", e.response?.data || e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        
        let error = "*❌ දෝෂයක්:* ";
        if(e.response?.status === 401) error += "API Key අවුල්. Key එක check කරන්න";
        else if(e.response?.status === 400) error += "Link එක Private";
        else error += e.message;
        
        reply(error);
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
    if (mek.message?.listResponseMessage) {
        id = mek.message.listResponseMessage.singleSelectReply.selectedRowId;
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
*╭┈───〔 𝐕𝐈𝐃𝐄𝐎 𝐈𝐍𝐅𝐎 〕┈───⊷*
*├✦ 𝐓𝐢𝐭𝐥𝐞:* *${session.title}*
*├✦ 𝐀𝐮𝐭𝐡𝐨𝐫:* *${session.author?.nickname}*
*├✦ 𝐋𝐢𝐤𝐞𝐬:* *${session.stats?.digg_count?.toLocaleString()}*
*╰───────────────────⊷*
        `.trim();
        reply(info);
    }
});
