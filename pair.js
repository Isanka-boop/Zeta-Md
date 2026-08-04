// plugins/ACD_MENU.js — Full Custom UI Bot Menu System (Buttons + List + Fallback)
const { cmd, commands } = require('../command');
const { getSetting, isUserLoaded, initEnvsettings } = require('../settings');
const { getBuffer } = require('../lib/functions');
const os = require('os');  // For RAM info

// ══════════════════════════════════════════════════════════════════
// CONFIG — Change these to your own
// ══════════════════════════════════════════════════════════════════
const BOT_NAME    = '*ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲*';
const BOT_VERSION = 'v3.0';
const OWNER_NAME  = '*ɪꜱᴀɴᴋᴀ∇*';

// ── All Menu Specific Images (All commands have image + reply) ─────
const CAT_IMAGES = {
  main:       'https://files.catbox.moe/chtymz.jpg',
  alive:      'https://files.catbox.moe/chtymz.jpg',
  detail:     'https://files.catbox.moe/chtymz.jpg',
  group:      'https://files.catbox.moe/chtymz.jpg',
  main_cat:   'https://files.catbox.moe/chtymz.jpg',
  settings:   'https://files.catbox.moe/chtymz.jpg',
  tools:      'https://files.catbox.moe/chtymz.jpg',
  download:   'https://files.catbox.moe/chtymz.jpg',
  ai:         'https://files.catbox.moe/chtymz.jpg',
  fun:        'https://files.catbox.moe/chtymz.jpg',
  search:     'https://files.catbox.moe/chtymz.jpg',
  anime:      'https://files.catbox.moe/chtymz.jpg',
  owner:      'https://files.catbox.moe/chtymz.jpg',
  textmaker:  'https://files.catbox.moe/chtymz.jpg',
  other:      'https://files.catbox.moe/chtymz.jpg'
};

// ── Category Specific React Emojis ───────────────────────────────
const CAT_REACTS = {
  group:      '👥',
  main:       '🏠',
  settings:   '⚙️',
  tools:      '🔧',
  download:   '⬇️',
  ai:         '🤖',
  fun:        '🎮',
  search:     '🔍',
  anime:      '🎎',
  owner:      '👨🏻‍💻',
  textmaker:  '🗒️',
  other:      '✨'
};

// ── Global Footer Content ────────────────────────────────────────
const GLOBAL_FOOTER = `\n╭─────𓆩★𓆪──────╮\n> ㋛ *𝙿σ𝚆є𝚁є𝙳 𝙱у ɪꜱᴀɴᴋᴀ∇*\n╰─────𓆩★𓆪──────╯`;

// ── Pending menu state: userId -> { stage, keys, cats, cmds, catName, prefix } ──
// (Kept ONLY as a fallback path — used when a client can't render buttons/lists
//  and the user just types a plain number instead of tapping.)
const menuState = new Map();

// ══════════════════════════════════════════════════════════════════
// HELPERS — data
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

// ══════════════════════════════════════════════════════════════════
// HELPERS — text builders
// ══════════════════════════════════════════════════════════════════

function buildMainCaption(pushname) {
  const uptime = Math.floor(process.uptime());
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const totalMemory = Math.round(os.totalmem() / 1024 / 1024);

  let text = `👋 *𝙷𝚎𝚢 ${pushname}, 𝚆𝚎𝚕𝚌𝚘𝚖𝚎 𝚃𝚘 ᴢᴇᴛᴀ!*\n`;
  text += `╭━━━〔 *『 BOT MENU 』* 〕━✦\n`;
  text += `┃ 👾 *Bot*    : ${BOT_NAME}\n`;
  text += `┃ 📞 *Owner*  : ${OWNER_NAME}\n`;
  text += `┃ 🌀 *Uptime* : *${hours}h ${minutes}m ${seconds}s*\n`;
  text += `┃ 🧠 *RAM*    : *${usedMemory}MB / ${totalMemory}MB*\n`;
  text += `╰━━━━━━━━━━━━━━━━━━━✦\n\n`;
  text += `📂 *Tap the button below and pick a category!*\n`;
  text += GLOBAL_FOOTER;
  return text;
}

function buildCategoryFallbackText(keys) {
  let text = `╔═══════════════════╗\n   📂 *SELECT A CATEGORY*\n╚═══════════════════╝\n`;
  keys.forEach((cat, i) => {
    text += `*${i + 1}.* │❯❯◦ *${cat.toUpperCase()}* MENU\n`;
  });
  text += `\n📝 *Reply with the category number.*\n`;
  text += GLOBAL_FOOTER;
  return text;
}

function buildCmdListFallbackText(cmds, catName, prefix) {
  let text = `╭──「 *${catName.toUpperCase()} COMMANDS* 」\n`;
  cmds.forEach((c, i) => {
    text += `│ *${i + 1}.* \`${prefix}${c.pattern}\`\n`;
    if (c.desc) text += `│    ─ _${c.desc}_\n`;
  });
  text += `╰─────────────\n\n`;
  text += `📝 *Reply with a number to see full command details!*\n`;
  text += GLOBAL_FOOTER;
  return text;
}

function buildCmdDetail(c, prefix) {
  let text = `╔══════════════════════╗\n`;
  text += `║   📌 *COMMAND DETAILS*   ║\n`;
  text += `╚══════════════════════╝\n\n`;
  text += `🔹 *Command:* \`${prefix}${c.pattern}\`\n`;
  if (c.desc)      text += `📝 *Info:* _${c.desc}_\n`;
  if (c.category)  text += `📂 *Category:* *${c.category.toUpperCase()}*\n`;
  if (c.alias?.length) text += `🔁 *Aliases:* ${c.alias.map(a => `\`${prefix}${a}\``).join(', ')}\n`;
  text += GLOBAL_FOOTER;
  return text;
}

// ══════════════════════════════════════════════════════════════════
// HELPERS — button / list builders
// ══════════════════════════════════════════════════════════════════

function buildCategorySections(cats) {
  const rows = Object.keys(cats).map((cat) => ({
    title: `${CAT_REACTS[cat] || CAT_REACTS.other}  ${cat.toUpperCase()} MENU`,
    description: `${cats[cat].length} command(s)`,
    rowId: `cat::${cat}`
  }));
  return [{ title: '📂 CATEGORIES', rows }];
}

function buildCommandSections(cmds, catName, prefix) {
  const rows = cmds.map((c, i) => ({
    title: `${i + 1}. ${prefix}${c.pattern}`,
    description: c.desc || 'No description',
    rowId: `cmd::${catName}::${i}`
  }));
  return [{ title: `📜 ${catName.toUpperCase()} COMMANDS`, rows }];
}

function detailButtons(catName) {
  return [
    { buttonId: `back::cat::${catName}`, buttonText: { displayText: '🔙 Back To List' }, type: 1 },
    { buttonId: 'back::main',            buttonText: { displayText: '🏠 Main Menu'    }, type: 1 }
  ];
}

// ══════════════════════════════════════════════════════════════════
// HELPERS — senders (image → list/buttons → plain-text triple fallback)
// ══════════════════════════════════════════════════════════════════

async function sendListScreen(conn, mek, from, { imgUrl, caption, title, buttonText, sections, fallbackText }) {
  const payload = {
    caption,
    footer: GLOBAL_FOOTER,
    title,
    buttonText: buttonText || '📂 Open Menu',
    sections
  };
  try {
    const imgBuf = await getBuffer(imgUrl);
    await conn.sendMessage(from, { ...payload, image: imgBuf, mimetype: 'image/jpeg' }, { quoted: mek });
    return;
  } catch (e1) {
    try {
      // Some WA/Baileys forks don't accept image+list together — retry as text-only list.
      const { caption: text, ...rest } = payload;
      await conn.sendMessage(from, { text, ...rest }, { quoted: mek });
      return;
    } catch (e2) {
      // Client/fork has no list-message support at all — plain numbered text.
      await conn.sendMessage(from, { text: fallbackText }, { quoted: mek });
    }
  }
}

async function sendButtonScreen(conn, mek, from, { imgUrl, caption, buttons }) {
  try {
    const imgBuf = await getBuffer(imgUrl);
    await conn.sendMessage(from, {
      image: imgBuf,
      mimetype: 'image/jpeg',
      caption,
      footer: GLOBAL_FOOTER,
      buttons,
      headerType: 4
    }, { quoted: mek });
    return;
  } catch (e1) {
    try {
      await conn.sendMessage(from, {
        text: caption,
        footer: GLOBAL_FOOTER,
        buttons,
        headerType: 1
      }, { quoted: mek });
      return;
    } catch (e2) {
      await conn.sendMessage(from, { text: caption }, { quoted: mek });
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// SCREEN RENDERERS (shared by /menu, button taps, and numeric fallback)
// ══════════════════════════════════════════════════════════════════

async function renderMainMenu(conn, mek, from, sender, pushname, prefix) {
  const cats = groupByCategory();
  const keys = Object.keys(cats);

  menuState.set(sender, { stage: 'main', keys, cats, prefix });
  setTimeout(() => menuState.delete(sender), 120000); // 2 min timeout

  await sendListScreen(conn, mek, from, {
    imgUrl: CAT_IMAGES.main,
    caption: buildMainCaption(pushname),
    title: '「 ZETA MENU 」',
    buttonText: '📂 Select Category',
    sections: buildCategorySections(cats),
    fallbackText: buildMainCaption(pushname) + '\n' + buildCategoryFallbackText(keys)
  });
}

async function renderCategoryScreen(conn, mek, from, catName, cmds, prefix, sender) {
  menuState.set(sender, { stage: 'category', catName, cmds, prefix, cats: groupByCategory(), keys: Object.keys(groupByCategory()) });

  const reactionEmoji = CAT_REACTS[catName.toLowerCase()] || CAT_REACTS.other;
  await conn.sendMessage(from, { react: { text: reactionEmoji, key: mek.key } });

  const catImgUrl = CAT_IMAGES[catName.toLowerCase()] || CAT_IMAGES.other;
  const caption = `╭──「 *${catName.toUpperCase()} COMMANDS* 」\n📌 *Tap a command below to view full details.*\n${GLOBAL_FOOTER}`;

  await sendListScreen(conn, mek, from, {
    imgUrl: catImgUrl,
    caption,
    title: `「 ${catName.toUpperCase()} 」`,
    buttonText: '📜 View Commands',
    sections: buildCommandSections(cmds, catName, prefix),
    fallbackText: buildCmdListFallbackText(cmds, catName, prefix)
  });
}

async function renderDetailScreen(conn, mek, from, cmdObj, catName, prefix, sender) {
  menuState.set(sender, { ...menuState.get(sender), stage: 'detail', cmd: cmdObj, catName, prefix });

  await conn.sendMessage(from, { react: { text: '📌', key: mek.key } });

  const detailImgUrl = CAT_IMAGES.detail || CAT_IMAGES.other;
  await sendButtonScreen(conn, mek, from, {
    imgUrl: detailImgUrl,
    caption: buildCmdDetail(cmdObj, prefix),
    buttons: detailButtons(catName)
  });
}

// ══════════════════════════════════════════════════════════════════
// MAIN MENU COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'menu',
  alias: ['help', 'cmds', 'commands'],
  desc: 'Interactive bot menu with buttons',
  category: 'main',
  react: '📁',
  filename: __filename
}, async (conn, mek, m, { sender, from, pushname, prefix, reply }) => {
  try {
    if (!isUserLoaded(sender)) await initEnvsettings(sender);
    await renderMainMenu(conn, mek, from, sender, pushname, prefix);
  } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// ══════════════════════════════════════════════════════════════════
// NAVIGATION LISTENER — handles BOTH:
//   1) Real button/list taps  (listResponseMessage / buttonsResponseMessage)
//   2) Plain-text number replies (fallback for clients without button support)
// ══════════════════════════════════════════════════════════════════
cmd({
  on: 'body',
  dontAddCommandList: true,
  filename: __filename
}, async (conn, mek, m, { sender, body, from, reply, prefix }) => {
  try {
    // ── 1) Try to read a real button/list tap first ──────────────
    const selectedId =
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      m.message?.buttonsResponseMessage?.selectedButtonId ||
      m.message?.templateButtonReplyMessage?.selectedId ||
      null;

    if (selectedId) {
      const cats = groupByCategory();

      if (selectedId === 'back::main') {
        return renderMainMenu(conn, mek, from, sender, m.pushName || 'there', prefix);
      }

      if (selectedId.startsWith('cat::')) {
        const catName = selectedId.slice('cat::'.length);
        const cmds = cats[catName];
        if (!cmds) return;
        return renderCategoryScreen(conn, mek, from, catName, cmds, prefix, sender);
      }

      if (selectedId.startsWith('cmd::')) {
        const [, catName, idxStr] = selectedId.split('::');
        const idx = parseInt(idxStr);
        const cmds = cats[catName];
        if (!cmds || isNaN(idx) || !cmds[idx]) return;
        return renderDetailScreen(conn, mek, from, cmds[idx], catName, prefix, sender);
      }

      if (selectedId.startsWith('back::cat::')) {
        const catName = selectedId.split('::')[2];
        const cmds = cats[catName];
        if (!cmds) return;
        return renderCategoryScreen(conn, mek, from, catName, cmds, prefix, sender);
      }

      return; // unknown id — ignore
    }

    // ── 2) Fallback: plain-text numeric navigation ───────────────
    if (!menuState.has(sender)) return;

    const input = body.trim();
    const state = menuState.get(sender);

    if (input === '0') return; // 0 = ignore completely

    // Stage: main → select category
    if (state.stage === 'main') {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > state.keys.length) return;
      const catName = state.keys[num - 1];
      const cmds = state.cats[catName];
      return renderCategoryScreen(conn, mek, from, catName, cmds, state.prefix, sender);
    }

    // Stage: category → select command
    if (state.stage === 'category') {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > state.cmds.length) return;
      const cmdObj = state.cmds[num - 1];
      return renderDetailScreen(conn, mek, from, cmdObj, state.catName, state.prefix, sender);
    }

    // Stage: detail → back to category list
    if (state.stage === 'detail') {
      const num = parseInt(input);
      if (isNaN(num)) return;
      return renderCategoryScreen(conn, mek, from, state.catName, state.cmds, state.prefix, sender);
    }

  } catch (e) {
    console.error('[MENU NAV ERROR]', e);
  }
});

// ══════════════════════════════════════════════════════════════════
// ALIVE COMMAND — Bold status card + quick-reply button to Menu
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'alive',
  alias: ['status', 'bot'],
  desc: 'Check if bot is alive',
  category: 'main',
  react: '💚',
  filename: __filename
}, async (conn, mek, m, { from, pushname, reply }) => {
  try {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const min = Math.floor((uptime % 3600) / 60);
    const sec = Math.floor(uptime % 60);
    const totalCmds = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

    let text = `╭━━━〔 *『 BOT STATUS 』* 〕━✦\n`;
    text += `┃ 🟢 *Status* : *Online & Running*\n`;
    text += `┃ 🤖 *Bot*    : ${BOT_NAME} *${BOT_VERSION}*\n`;
    text += `┃ 👋 *Owner*  : ${OWNER_NAME}\n`;
    text += `┃ ⏱️ *Uptime* : *${h}h ${min}m ${sec}s*\n`;
    text += `┃ 📊 *Cmds*   : *${totalCmds}*\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━✦\n\n`;
    text += `_💡 Tap below to open the interactive menu_\n`;
    text += GLOBAL_FOOTER;

    await sendButtonScreen(conn, mek, from, {
      imgUrl: CAT_IMAGES.alive,
      caption: text,
      buttons: [{ buttonId: 'back::main', buttonText: { displayText: '📂 Open Menu' }, type: 1 }]
    });
  } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// ══════════════════════════════════════════════════════════════════
// HOW COMMAND — Command detail lookup, with Back/Main buttons
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'how',
  alias: ['usage', 'cmdinfo'],
  desc: 'Get details for a command. Usage: /how <command>',
  category: 'main',
  react: '❓',
  filename: __filename
}, async (conn, mek, m, { from, reply, q, prefix }) => {
  try {
    if (!q) return reply(`❌ *Usage:* /how <command name>\n_Example:_ \`/how ytmp3\``);
    const name = q.toLowerCase().replace(/^[^a-z0-9]/g, '');
    const found = commands.find(c =>
      c.pattern === name ||
      (c.alias && c.alias.includes(name))
    );
    if (!found) return reply(`❌ Command *${name}* not found.\nUse \`/menu\` to browse all commands.`);

    await sendButtonScreen(conn, mek, from, {
      imgUrl: CAT_IMAGES.detail || CAT_IMAGES.other,
      caption: buildCmdDetail(found, prefix),
      buttons: [{ buttonId: 'back::main', buttonText: { displayText: '📂 Open Menu' }, type: 1 }]
    });
  } catch (e) { reply(`❌ Error: ${e.message}`); }
});
