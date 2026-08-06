// plugins/ACD_MENU.js — Full Custom UI Bot Menu System (Strict Stage Lockdown)
// ---------------------------------------------------------------------
// Flow:
//   .menu  → sends a WhatsApp LIST message, one row per category
//   tap category row → shows numbered command list for that category (image)
//   reply with a number → shows detail card for that command
//   reply with a number again (while in detail) → back to category list
// ---------------------------------------------------------------------

// ── Fallback globals (remove if your bot already defines these) ──
const BOT_NAME = global.BOT_NAME || "𝐙𝐄𝐓𝐀 𝐌𝐃 ";
const BOT_VERSION = global.BOT_VERSION || "1.0.0";
const OWNER_NAME = global.OWNER_NAME || "𝐈𝐒𝐀𝐍𝐊𝐀";
const GLOBAL_FOOTER = global.GLOBAL_FOOTER || `\n> _ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴢᴇᴛᴀ ᴍɪɴɪ_`;

// category(lowercase) -> thumbnail url. 'main', 'detail', 'other' are special keys.
const CAT_IMAGES = global.CAT_IMAGES || {
    main: "https://telegra.ph/file/main-menu-thumb.jpg",
    detail: "https://telegra.ph/file/detail-thumb.jpg",
    other: "https://telegra.ph/file/other-thumb.jpg",
    download: "https://telegra.ph/file/download-thumb.jpg",
    search: "https://telegra.ph/file/search-thumb.jpg",
    group: "https://telegra.ph/file/group-thumb.jpg",
    owner: "https://telegra.ph/file/owner-thumb.jpg",
    fun: "https://telegra.ph/file/fun-thumb.jpg",
    tool: "https://telegra.ph/file/tool-thumb.jpg",
    ai: "https://telegra.ph/file/ai-thumb.jpg",
};
global.CAT_IMAGES = CAT_IMAGES;

const CAT_EMOJIS = {
    main: "🏠", download: "📥", search: "🔍", group: "👥", owner: "👑",
    fun: "🎉", tool: "🛠️", ai: "🤖", other: "📦",
};

if (!global.getBuffer) {
    const axios = require("axios");
    global.getBuffer = async (url) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return Buffer.from(res.data);
    };
}
const getBuffer = global.getBuffer;

// sender -> { stage, cmds, catName, prefix, ts }
const menuState = global.menuState || new Map();
global.menuState = menuState;

// Auto-clear stale navigation state after 10 min idle (avoid memory leaks)
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of menuState.entries()) {
        if (val.ts && now - val.ts > 10 * 60 * 1000) menuState.delete(key);
    }
}, 5 * 60 * 1000);

function setState(sender, data) {
    menuState.set(sender, { ...data, ts: Date.now() });
}

// ── Helpers ─────────────────────────────────────────────────────────
function getCategories() {
    const cats = new Set();
    commands.forEach((c) => {
        if (c.pattern && !c.dontAddCommandList) cats.add((c.category || "other").toLowerCase());
    });
    return [...cats];
}

function buildCmdList(cmds, catName, prefix) {
    let text = `╭━━━〔 *${catName.toUpperCase()}* 〕━━━╮\n`;
    cmds.forEach((c, i) => {
        text += `┃ ${i + 1}. \`${prefix}${c.pattern}\`${c.desc ? ` — ${c.desc}` : ""}\n`;
    });
    text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    text += `_📝 Reply with a number to view that command's details_\n`;
    text += `_🔙 Send \`.menu\` anytime to restart_`;
    text += GLOBAL_FOOTER;
    return text;
}

function buildCmdDetail(cmdObj, prefix) {
    let text = `╭━━━〔 *COMMAND INFO* 〕━━━╮\n`;
    text += `┃ 📌 *Name:* ${prefix}${cmdObj.pattern}\n`;
    if (cmdObj.alias?.length) {
        text += `┃ 🔗 *Alias:* ${cmdObj.alias.map((a) => prefix + a).join(", ")}\n`;
    }
    text += `┃ 📂 *Category:* ${cmdObj.category || "other"}\n`;
    text += `┃ 📝 *Desc:* ${cmdObj.desc || "No description"}\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    text += `_🔙 Reply with any number to go back to the list_`;
    text += GLOBAL_FOOTER;
    return text;
}

// =====================================================================
// COMMAND: .menu — sends the category list (WhatsApp list message)
// =====================================================================
cmd(
    {
        pattern: "menu",
        alias: ["allmenu", "menu2"],
        desc: "Open the interactive category menu",
        category: "main",
        react: "📋",
        filename: __filename,
    },
    async (conn, mek, m, { from, sender, reply, prefix }) => {
        try {
            const categories = getCategories();
            if (!categories.length) return reply("❌ No commands registered yet.");

            const rows = categories.map((cat) => {
                const count = commands.filter(
                    (c) => (c.category || "other").toLowerCase() === cat && c.pattern && !c.dontAddCommandList
                ).length;
                return {
                    title: `${CAT_EMOJIS[cat] || "📦"} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
                    rowId: `menucat_${cat}`,
                    description: `${count} command${count !== 1 ? "s" : ""}`,
                };
            });

            setState(sender, { stage: "main", prefix });

            const listMsg = {
                image: { url: CAT_IMAGES[""] || CAT_IMAGES[""] },
                caption:
                    `╭━━━〔 *${BOT_NAME}* 〕━━━╮\n` +
                    `┃ 📂 Browse commands by category\n` +
                    `┃ 👇 Tap a category below\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯` +
                    GLOBAL_FOOTER,
                footer: GLOBAL_FOOTER,
                title: `${BOT_NAME} Menu`,
                buttonText: "📂 Select Category",
                sections: [{ title: "Categories", rows }],
            };

            await conn.sendMessage(from, listMsg, { quoted: mek });
        } catch (e) {
            reply(`❌ Error: ${e.message}`);
        }
    }
);

// =====================================================================
// NAVIGATION HANDLER — category row taps + numbered text replies
// =====================================================================
cmd({ on: "body" }, async (conn, mek, m, { from, sender, body, reply, prefix }) => {
    try {
        // ── Handle list/button row selection (category pick) ──
        let selectedId = null;
        if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
            selectedId = mek.message.listResponseMessage.singleSelectReply.selectedRowId;
        } else if (mek.message?.buttonsResponseMessage?.selectedButtonId) {
            selectedId = mek.message.buttonsResponseMessage.selectedButtonId;
        }

        if (selectedId && selectedId.startsWith("menucat_")) {
            const catName = selectedId.replace("menucat_", "");
            const cmds = commands.filter(
                (c) => (c.category || "other").toLowerCase() === catName && c.pattern && !c.dontAddCommandList
            );

            if (!cmds.length) return reply(`❌ No commands found in *${catName}*.`);

            const listText = buildCmdList(cmds, catName, prefix);
            setState(sender, { stage: "category", cmds, catName, prefix });

            const catImgUrl = CAT_IMAGES[catName.toLowerCase()] || CAT_IMAGES["other"];
            try {
                const imgBuf = await getBuffer(catImgUrl);
                await conn.sendMessage(from, { image: imgBuf, caption: listText, mimetype: "image/jpeg" }, { quoted: mek });
            } catch {
                reply(listText);
            }
            return;
        }

        // Below only applies to users currently mid-navigation
        const state = menuState.get(sender);
        if (!state) return;

        const input = (body || "").trim();

        // ── Stage: category → pick a numbered command, show its detail ──
        if (state.stage === "category") {
            const num = parseInt(input);
            if (isNaN(num) || num < 1 || num > state.cmds.length) return;

            const found = state.cmds[num - 1];
            const detailText = buildCmdDetail(found, state.prefix);
            setState(sender, { ...state, stage: "detail" });

            const detailImgUrl = CAT_IMAGES["detail"] || CAT_IMAGES["other"];
            try {
                const imgBuf = await getBuffer(detailImgUrl);
                await conn.sendMessage(from, { image: imgBuf, caption: detailText, mimetype: "image/jpeg" }, { quoted: mek });
            } catch {
                reply(detailText);
            }
            return;
        }

        // ── Stage: detail → Show category list again with Image + Reply ──
        if (state.stage === "detail") {
            const num = parseInt(input);
            if (isNaN(num)) return;

            const listText = buildCmdList(state.cmds, state.catName, state.prefix);
            setState(sender, { ...state, stage: "category" });

            const catImgUrl = CAT_IMAGES[state.catName.toLowerCase()] || CAT_IMAGES["other"];

            try {
                const imgBuf = await getBuffer(catImgUrl);
                await conn.sendMessage(from, { image: imgBuf, caption: listText, mimetype: "image/jpeg" }, { quoted: mek });
            } catch {
                reply(listText);
            }
            return;
        }
    } catch (e) {
        console.error("[MENU NAV ERROR]", e);
    }
});

// ══════════════════════════════════════════════════════════════════
// ALIVE COMMAND — Hacker Font Backticks + Image + Reply + Global Footer
// ══════════════════════════════════════════════════════════════════
cmd(
    {
        pattern: "alive",
        alias: ["status", "bot"],
        desc: "Check if bot is alive",
        category: "main",
        react: "❤️‍🩹",
        filename: __filename,
    },
    async (conn, mek, m, { from, pushname, reply }) => {
        try {
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const min = Math.floor((uptime % 3600) / 60);
            const sec = Math.floor(uptime % 60);
            const totalCmds = commands.filter((c) => c.pattern && !c.dontAddCommandList).length;

            let text = `╭━━━〔 𝗔𝗟𝗜𝗩𝗘 〕━✦\n`;
            text += `│  🟢 \`Status\`   : Online & Running\n`;
            text += `│  🤖 \`Bot\`      : ${BOT_NAME} v${BOT_VERSION}\n`;
            text += `│  👋 \`Owner\`     : ${OWNER_NAME}\n`;
            text += `│  ⏱️ \`Uptime\`   : ${h}h ${min}m ${sec}s\n`;
            text += `│  📊 \`Cmds\`     : ${totalCmds}\n`;
            text += `╰────────────╯\n\n`;
            text += `_💡 Use \`.menu\` to open the interactive UI_\n`;
            text += GLOBAL_FOOTER;

            try {
                const imgBuf = await getBuffer(CAT_IMAGES[""] || CAT_IMAGES[""]);
                await conn.sendMessage(from, { image: imgBuf, caption: text, mimetype: "image/jpeg" }, { quoted: mek });
            } catch {
                reply(text);
            }
        } catch (e) {
            reply(`❌ Error: ${e.message}`);
        }
    }
);

// ══════════════════════════════════════════════════════════════════
// HELP COMMAND — Image + Reply + Global Footer
// ══════════════════════════════════════════════════════════════════
cmd(
    {
        pattern: "how",
        alias: ["usage", "cmdinfo"],
        desc: "Get details for a command. Usage: /how <command>",
        category: "main",
        react: "❓",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, q, prefix }) => {
        try {
            if (!q) return reply(`❌ Usage: /how <command name>\nExample: /how ytmp3`);
            const name = q.toLowerCase().replace(/^[^a-z0-9]/g, "");
            const found = commands.find((c) => c.pattern === name || (c.alias && c.alias.includes(name)));
            if (!found) return reply(`❌ Command *${name}* not found.\nUse \`/menu\` to browse all commands.`);

            const detailText = buildCmdDetail(found, prefix);
            const detailImgUrl = CAT_IMAGES["detail"] || CAT_IMAGES["other"];

            try {
                const imgBuf = await getBuffer(detailImgUrl);
                await conn.sendMessage(from, { image: imgBuf, caption: detailText, mimetype: "image/jpeg" }, { quoted: mek });
            } catch {
                reply(detailText);
            }
        } catch (e) {
            reply(`❌ Error: ${e.message}`);
        }
    }
);
