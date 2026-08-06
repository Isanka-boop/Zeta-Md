// plugins/ACD_TIKTOK.js — TikTok Downloader (Auto DL + Buttons + Menu)
// ---------------------------------------------------------------------
// Framework assumptions (edit if your loader differs):
//   - Global/require: cmd, commands (command registration helper)
//   - conn, mek, from, reply available inside handler
//   - getBuffer(url) -> axios/fetch buffer helper already exists elsewhere
//   - BOT_NAME, TIKTOK_IMG constants exist elsewhere (fallbacks added below)
// ---------------------------------------------------------------------

const axios = require("axios");

// ── Fallbacks (remove if your bot already defines these globally) ──
const BOT_NAME = global.BOT_NAME || "𝐙𝐞𝐭𝐚 𝐌𝐝";
const TIKTOK_IMG =
    global.TIKTOK_IMG ||
    "https://telegra.ph/file/6a5c4e3f5e2b6b1b1b1b1.jpg"; // replace with your own thumb

function getDateTimeLine() {
    return new Date().toLocaleString("en-US", {
        timeZone: "Asia/Colombo",
        dateStyle: "medium",
        timeStyle: "short",
    });
}

if (!global.getBuffer) {
    global.getBuffer = async (url) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return Buffer.from(res.data);
    };
}
const getBuffer = global.getBuffer;

// In-memory session store: sessionId -> tiktok data
const tiktokSession = global.tiktokSession || new Map();
global.tiktokSession = tiktokSession;

// ── TikTok fetch helper (tikwm.com free API — swap URL below if you
//    have a different / paid "WhiteShadow" endpoint) ──────────────
async function fetchTikTok(url) {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
    const { data } = await axios.get(api, { timeout: 20000 });

    if (!data || data.code !== 0 || !data.data) {
        throw new Error("TikTok දත්ත ලබාගැනීමට නොහැකි විය. Link එක නිවැරදිද බලන්න.");
    }

    const d = data.data;
    return {
        title: d.title || "No Caption",
        author: { nickname: d.author?.nickname, unique_id: d.author?.unique_id },
        stats: {
            digg_count: d.digg_count,
            comment_count: d.comment_count,
            share_count: d.share_count,
            play_count: d.play_count,
        },
        thumb: d.cover || d.origin_cover,
        // No-watermark direct video URL
        videoNW: d.play,
        // HD (if available) falls back to normal
        video: d.hdplay || d.play,
        // Audio-only URL
        audio: d.music,
    };
}

function makeSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Build the WhatsApp button message for a fetched TikTok ─────────
function buildTikTokButtons(session, sessionId) {
    const caption = `
╭━━━〔 *𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* 〕━━━╮
┃
┃ 📌 *Title:* ${session.title}
┃ 👤 *Author:* ${session.author?.nickname || "Unknown"}
┃
┃ ❤️ ${session.stats?.digg_count?.toLocaleString() || 0}   💬 ${session.stats?.comment_count?.toLocaleString() || 0}   🔄 ${session.stats?.share_count?.toLocaleString() || 0}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
> *Choose an option below 👇*
`.trim();

    return {
        image: { url: session.thumb || TIKTOK_IMG },
        caption,
        footer: BOT_NAME,
        buttons: [
            { buttonId: `ttvideonw_${sessionId}`, buttonText: { displayText: "📹 No-WM Video" }, type: 1 },
            { buttonId: `ttaudio_${sessionId}`, buttonText: { displayText: "🎵 Audio Only" }, type: 1 },
            { buttonId: `ttinfo_${sessionId}`, buttonText: { displayText: "📊 Video Info" }, type: 1 },
        ],
        headerType: 4,
    };
}

// ── Main-menu / status button set (matches the screenshot layout) ──
function buildMainListMessage(sessionId = "menu") {
    return {
        image: { url: TIKTOK_IMG },
        caption: `*${BOT_NAME}*\n\nSelect an option below.`,
        footer: BOT_NAME,
        buttons: [
            { buttonId: `ttmenu_${sessionId}`, buttonText: { displayText: "↩ Main Menu 🏠" }, type: 1 },
            { buttonId: `ttping_${sessionId}`, buttonText: { displayText: "↩ Bot Status ✅" }, type: 1 },
        ],
        headerType: 4,
    };
}

// =====================================================================
// COMMAND: .tt <tiktok url>  — auto fetch + auto-download NW video + buttons
// =====================================================================
cmd(
    {
        pattern: "tt",
        alias: ["tiktok", "tt2"],
        desc: "Download TikTok video (auto, no watermark) + interactive buttons",
        category: "download",
        filename: __filename,
    },
    async (conn, mek, m, { from, args, reply, q }) => {
        try {
            const url = q || args[0];
            if (!url || !url.includes("tiktok.com")) {
                return reply(
                    "*📥 TikTok Downloader*\n\nUsage:\n`.tt <tiktok video url>`\n\nExample:\n`.tt https://vt.tiktok.com/xxxxx`"
                );
            }

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            const data = await fetchTikTok(url);
            const sessionId = makeSessionId();
            tiktokSession.set(sessionId, data);

            // auto-expire session after 15 min to avoid memory leaks
            setTimeout(() => tiktokSession.delete(sessionId), 15 * 60 * 1000);

            // ── Auto-download the no-watermark video immediately ──
            if (data.videoNW) {
                const videoBuf = await getBuffer(data.videoNW);
                if (!videoBuf || videoBuf.length < 1000) {
                    throw new Error("Video buffer ලබාගැනීමට අසාර්ථක විය.");
                }

                const niceCaption = `
╭━━━〔 *✅ 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐃* 〕━━━╮
┃ 📌 ${data.title}
┃ 👤 @${data.author?.unique_id || "unknown"}
┃ ❤️ ${data.stats?.digg_count?.toLocaleString() || 0}  ▶️ ${data.stats?.play_count?.toLocaleString() || 0}
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯
> *${BOT_NAME} — No Watermark*
`.trim();

                await conn.sendMessage(
                    from,
                    { video: videoBuf, mimetype: "video/mp4", caption: niceCaption },
                    { quoted: mek }
                );
            }

            // ── Then send the interactive button card for extra options ──
            const btnMsg = buildTikTokButtons(data, sessionId);
            await conn.sendMessage(from, btnMsg, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } catch (e) {
            console.error("[TT CMD ERROR]", e);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            reply(`*❌ Error:* ${e.message}`);
        }
    }
);

// =====================================================================
// COMMAND: .menu — sends the Main Menu / Bot Status button card
// =====================================================================
cmd(
    {
        pattern: "menu",
        alias: ["allmenu", "help2"],
        desc: "Show bot menu with interactive buttons",
        category: "main",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply }) => {
        try {
            await conn.sendMessage(from, { react: { text: "📋", key: mek.key } });
            await conn.sendMessage(from, buildMainListMessage(), { quoted: mek });
        } catch (e) {
            console.error("[MENU CMD ERROR]", e);
            reply(`*❌ Error:* ${e.message}`);
        }
    }
);

// =====================================================================
// BUTTON RESPONSE HANDLER
// =====================================================================
cmd({ on: "body" }, async (conn, mek, m, { from, reply, isGroup }) => {
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

        // ── PING / STATUS BUTTON ──
        if (action === "ping") {
            await conn.sendMessage(from, { react: { text: "🏓", key: mek.key } });
            const start = Date.now();
            await new Promise((r) => setTimeout(r, 100));
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
            return reply("*❌ Session expired. නැවත `.tt` command එක run කරන්න.*");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        if (action === "audio") {
            if (!session.audio) return reply("*❌ Audio එක හමු නොවීය*");
            const audioBuf = await getBuffer(session.audio);
            if (!audioBuf || audioBuf.length < 1000) throw new Error("Audio Download Failed");
            await conn.sendMessage(
                from,
                { audio: audioBuf, mimetype: "audio/mpeg", fileName: `${session.title}.mp3` },
                { quoted: mek }
            );
            await conn.sendMessage(from, { react: { text: "🎵", key: mek.key } });
        }

        if (action === "videonw") {
            if (!session.videoNW) return reply("*❌ Video URL නැත*");
            const videoBuf = await getBuffer(session.videoNW);
            await conn.sendMessage(
                from,
                { video: videoBuf, mimetype: "video/mp4", caption: `*✅ No Watermark Video*\n\n📝 ${session.title}` },
                { quoted: mek }
            );
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
