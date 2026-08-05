// plugins/ACD_MENU.js — Full Custom UI Bot Menu System (Strict Stage Lockdown)
const { cmd, commands } = require('../command');
const { getSetting, isUserLoaded, initEnvsettings } = require('../settings');
const { getBuffer } = require('../lib/functions');
const os = require('os');  // For RAM info

// ══════════════════════════════════════════════════════════════════
// CONFIG — Change these to your own
// ══════════════════════════════════════════════════════════════════
const BOT_NAME    = 'ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲';
const BOT_VERSION = 'v3.0';
const OWNER_NAME  = 'ɪꜱᴀɴᴋᴀ∇';

// ── All Menu Specific Images (All commands have image + reply) ─────
const CAT_IMAGES = {
  main:       'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ', // Main Menu Image
  alive:      'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ', // Alive Image
  detail:     'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ', // Command Details Image
  group:      'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  main_cat:   'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ', 
  settings:   'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  tools:      'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  download:   'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  ai:         'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  fun:        'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  search:     'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  anime:      'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  owner:      'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  textmaker:  'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ',
  other:      'https://files.catbox.moe/chtymz.jpg',//ɪᴍᴀɢᴇ'  // Default fallback
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
const GLOBAL_FOOTER = `\n╭─────𓆩★𓆪──────╮\n> ㋛ 𝙿σ𝚆є𝚁є𝙳 𝙱у ɪꜱᴀɴᴋᴀ∇\n╰─────𓆩★𓆪──────╯`;

// ── Pending menu state: userId -> { stage, keys, cats, cmds, catName, prefix } ──
const menuState = new Map();

// ══════════════════════════════════════════════════════════════════
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

function buildCategoryList(cats) {
  const keys = Object.keys(cats);
  let text = '';
  keys.forEach((cat, i) => {
    const numStr = (i + 1) < 10 ? `*${i + 1}.* ` : `*${i + 1}.*`;
    text += `${numStr}│❯❯◦ ${cat.toUpperCase()} MENU\n`;
  });
  return { text, keys };
}

function buildCmdList(cmds, catName, prefix) {
  let text = `╭──「 ${catName.toUpperCase()} COMMANDS 」\n`;
  cmds.forEach((c, i) => {
    text += `│ ${i + 1}. \`${prefix}${c.pattern}\`\n`;
    if (c.desc) text += `│    ─ _${c.desc}_\n`;
  });
  text += `╰─────────────\n\n`;
  text += `📝 *Reply with a number to see full command details!*\n`;
  text += GLOBAL_FOOTER;
  return text;
}

function buildCmdDetail(c, prefix) {
  let text = `╔══════════════════════╗\n`;
  text += `║  📌 COMMAND DETAILS  ║\n`;
  text += `╚══════════════════════╝\n\n`;
  text += `🔹 *Command:* \`${prefix}${c.pattern}\`\n`;
  if (c.desc)      text += `📝 *Info:* ${c.desc}\n`;
  if (c.category)  text += `📂 *Category:* ${c.category.toUpperCase()}\n`;
  if (c.alias?.length) text += `🔁 *Aliases:* ${c.alias.map(a => `\`${prefix}${a}\``).join(', ')}\n`;
  text += GLOBAL_FOOTER;
  return text;
}

// ══════════════════════════════════════════════════════════════════
// MAIN MENU COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'menu',
  alias: ['help', 'cmds', 'commands'],
  desc: 'Interactive bot menu with image',
