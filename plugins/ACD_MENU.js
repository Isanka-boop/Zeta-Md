// plugins/ACD_MENU.js — Full Custom UI Bot Menu System
const { cmd, commands } = require('../command');
const { getSetting, isUserLoaded, initEnvsettings } = require('../settings');
const { getBuffer } = require('../lib/functions');
const os = require('os');

// ══════════
// CONFIG
// ══════════════════════════════════════════
const BOT_NAME = 'ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲';
const BOT_VERSION = 'v3.0';
const OWNER_NAME = 'ɪꜱᴀɴᴋᴀ∇';

// ── Images ─────
const CAT_IMAGES = {
  main: 'https://files.catbox.moe/chtymz.jpg',
  alive: 'https://files.catbox.moe/chtymz.jpg',
  detail: 'https://files.catbox.moe/chtymz.jpg',
  group: 'https://files.catbox.moe/chtymz.jpg',
  main_cat: 'https://files.catbox.moe/chtymz.jpg',
  settings: 'https://files.catbox.moe/chtymz.jpg',
  tools: 'https://files.catbox.moe/chtymz.jpg',
  download: 'https://files.catbox.moe/chtymz.jpg',
  ai: 'https://files.catbox.moe/chtymz.jpg',
  fun: 'https://files.catbox.moe/chtymz.jpg',
  search: 'https://files.catbox.moe/chtymz.jpg',
  anime: 'https://files.catbox.moe/chtymz.jpg',
  owner: 'https://files.catbox.moe/chtymz.jpg',
  textmaker: 'https://files.catbox.moe/chtymz.jpg',
  other: 'https://files.catbox.moe/chtymz.jpg'
};

// ── React Emojis ───────────────────────────────
const CAT_REACTS = {
  group: '👥', main: '🏠', settings: '⚙️', tools: '🔧', download: '⬇️',
  ai: '🤖', fun: '🎮', search: '🔍', anime: '🎎', owner: '👨🏻‍💻', textmaker: '🗒️', other: '✨'
};

const GLOBAL_FOOTER = `\n╭─────𓆩★𓆪──────╮\n> ㋛ 𝙿σ𝚆є𝚁є𝙳 𝙱у ${OWNER_NAME}\n╰─────𓆩★𓆪──────╯`;

// ── Pending menu state ──
const menuState = new Map();

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

function groupByCategory() {
  const cats = {};
  for (const c of commands) {
    if (!c.pattern || c.dontAddCommandList) continue;
    const cat = (c.category || 'other').toLowerCase();
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push(c);
  }
  return cats;
}

function getSystemInfo(){
    const total = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const used = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const cpu = os.cpus()[0].model;
    return { total, used, cpu };
}

function buildCategoryList(cats) {
  const keys = Object.keys(cats);
  let text = `*╭┈───〔 ${BOT_NAME} 𝐌𝐄𝐍𝐔 〕┈───⊷*\n`;
  text += `*├✦ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧:* *${BOT_VERSION}*\n`;
  text += `*├✦ 𝐎𝐰𝐧𝐞𝐫:* *${OWNER_NAME}*\n`;
  text += `*├✦ 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐢𝐞𝐬:* *${keys.length}*\n`;
  text += `*├✦ 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:* *${commands.length}*\n`;
  text += `*╰───────────────────⊷*\n\n`;

  text += `*📌 𝐒𝐄𝐋𝐄𝐂𝐓 𝐀 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐘*\n\n`;

  keys.forEach((cat, i) => {
    const emoji = CAT_REACTS[cat] || '✨';
    text += `*${i + 1}.* ${emoji} *${cat.toUpperCase()}* \`(${cats[cat].length} cmds)\`\n`;
  });

  text += `\n*📝 Reply with a number to open category!*\n`;
  text += GLOBAL_FOOTER;
  return { text, keys };
}

function buildCmdList(cmds, catName, prefix) {
  let text = `*╭┈───〔 ${catName.toUpperCase()} 𝐂𝐌𝐃𝐒 〕┈───⊷*\n`;
  text += `*├✦ 𝐓𝐨𝐭𝐚𝐥:* *${cmds.length} 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬*\n`;
  text += `*╰───────────────────⊷*\n\n`;

  cmds.forEach((c, i) => {
    text += `*${i + 1}.* \`${prefix}${c.pattern}\`\n`;
    if (c.desc) text += ` └─ _${c.desc}_\n`;
  });

  text += `\n*📝 Reply with a number for details!*\n`;
  text += GLOBAL_FOOTER;
  return text;
}

function buildCmdDetail(c, prefix) {
  let text = `*╭┈───〔 𝐂𝐎𝐌𝐀𝐍𝐃 𝐃𝐄𝐓𝐀𝐈𝐋𝐒 〕┈───⊷*\n`;
  text += `*├✦ 𝐂𝐨𝐦𝐦𝐚𝐧𝐝:* *\`${prefix}${c.pattern}\`*\n`;
  if (c.desc) text += `*├✦ 𝐃𝐞𝐬𝐜:* *${c.desc}*\n`;
  if (c.category) text += `*├✦ 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲:* *${c.category.toUpperCase()}*\n`;
  if (c.alias?.length) text += `*├✦ 𝐀𝐥𝐢𝐚𝐬:* *${c.alias.map(a => `${prefix}${a}`).join(', ')}*\n`;
  text += `*╰───────────────────⊷*\n`;
  text += GLOBAL_FOOTER;
  return text;
}

// ══════════════════════════════════════════════════
// MAIN MENU COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'menu',
  alias: ['help', 'cmds', 'commands'],
  desc: "Show bot menu",
  category: "main",
  react: "🏠",
  filename: __filename
}, async (conn, mek, m, { from, prefix, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: "🏠", key: mek.key } });

        const cats = groupByCategory();
        const { text, keys } = buildCategoryList(cats);
        const img = await getBuffer(CAT_IMAGES.main);

        menuState.set(m.sender, { stage: 'category', keys, prefix });

        await conn.sendMessage(from, {
            image: img,
            caption: text
        }, { quoted: mek });

        // List Buttons
        const sections = [{
            title: "𝐒𝐄𝐋𝐄𝐂𝐓 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐘",
            rows: keys.map((cat, i) => ({
                title: `${CAT_REACTS[cat] || '✨'} ${cat.toUpperCase()}`,
                description: `${cats[cat].length} Commands`,
                id: `menu_cat_${i+1}`
            }))
        }];

        await conn.sendMessage(from, {
            text: `*𝐎𝐫 𝐮𝐬𝐞 𝐭𝐡𝐞 𝐛𝐮𝐭𝐭𝐨𝐧 𝐛𝐞𝐥𝐨𝐰 👇*`,
            footer: `> ${BOT_NAME}`,
            title: "𝐌𝐀𝐈𝐍 𝐌𝐄𝐍𝐔",
            buttonText: "𝐎𝐏𝐄𝐍 𝐌𝐄𝐍𝐔",
            sections
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`*❌ Error:* ${e.message}`);
    }
});

// ══════════════════════════════════════════════════════════════════
// MENU HANDLER
// ══════════════════════════════════════════════════════════
cmd({
    on: "text",
    fromMe: false
}, async (conn, mek, m, { body, sender, prefix, reply }) => {
    const state = menuState.get(sender);
    if (!state) return;

    let selection = body;
    if (mek.message?.listResponseMessage) {
        selection = mek.message.listResponseMessage.singleSelectReply.selectedRowId;
        selection = selection.replace('menu_cat_', '');
    }

    const num = parseInt(selection);
    if (isNaN(num)) return;

    const cats = groupByCategory();
    const keys = Object.keys(cats);

    // STAGE 1: Category Select
    if (state.stage === 'category') {
        const catName = keys[num - 1];
        if (!catName) return reply("*❌ Invalid Number*");

        const cmds = cats[catName];
        const text = buildCmdList(cmds, catName, prefix);
        const img = await getBuffer(CAT_IMAGES[catName] || CAT_IMAGES.other);

        menuState.set(sender, { stage: 'cmd', cmds, catName, prefix });

        await conn.sendMessage(from, {
            image: img,
            caption: text
        }, { quoted: mek });
    }

    // STAGE 2: Command Detail
    else if (state.stage === 'cmd') {
        const cmdObj = state.cmds[num - 1];
        if (!cmdObj) return reply("*❌ Invalid Number*");

        const text = buildCmdDetail(cmdObj, prefix);
        const img = await getBuffer(CAT_IMAGES[state.catName] || CAT_IMAGES.detail);

        menuState.set(sender, { stage: null }); // reset

        await conn.sendMessage(from, {
            image: img,
            caption: text
        }, { quoted: mek });
    }
});
