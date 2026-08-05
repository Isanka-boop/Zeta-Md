// plugins/ACD_MENU.js — Full Custom UI Bot Menu System (Strict Stage Lockdown)
// Now with real tappable WhatsApp buttons (native-flow), with the original
// numbered-text replies kept working as a fallback.
const { cmd, commands } = require('../command');
const { getSetting, isUserLoaded, initEnvsettings } = require('../settings');
const { getBuffer } = require('../lib/functions');
const os = require('os');  // For RAM info
const {
  proto,
  generateWAMessageFromContent,
  prepareWAMessageMedia
} = require('@whiskeysockets/baileys');

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
function scheduleExpiry(sender) {
  setTimeout(() => menuState.delete(sender), 120000); // 2 min timeout
}

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
  text += `📝 *Tap a command below, or reply with a number!*\n`;
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
// BUTTON BUILDERS — native-flow button payloads per stage
// ══════════════════════════════════════════════════════════════════

function catButtons(cats, keys, sender) {
  const rows = keys.map((cat, i) => ({
    title: `${i + 1}. ${cat.toUpperCase()}`,
    id: `menu_cat::${cat}::${sender}`,
    description: `${cats[cat].length} command${cats[cat].length === 1 ? '' : 's'}`
  }));
  return [{
    name: 'single_select',
    buttonParamsJson: JSON.stringify({
      title: '📂 Tap to choose a category',
      sections: [{ title: 'Categories', rows }]
    })
  }];
}

function cmdButtons(cmds, catName, prefix, sender) {
  const rows = cmds.map((c, i) => ({
    title: `${i + 1}. ${prefix}${c.pattern}`,
    id: `menu_cmd::${catName}::${i}::${sender}`,
    description: c.desc || ''
  }));
  return [
    {
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: `📜 ${catName.toUpperCase()} commands`,
        sections: [{ title: catName.toUpperCase(), rows }]
      })
    },
    {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: '🔙 Back to Categories', id: `menu_back::main::${sender}` })
    }
  ];
}

function detailButtons(catName, sender) {
  return [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `🔙 Back to ${catName.toUpperCase()}`, id: `menu_back::category::${sender}` }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🏠 Main Menu', id: `menu_back::main::${sender}` }) }
  ];
}

// ══════════════════════════════════════════════════════════════════
// sendInteractive — builds a real native-flow interactive message
// (image header + body + footer + buttons) and relays it directly.
// Falls back to a plain image/caption (numbered-text still works via
// the on:'body' listener below) if anything above fails.
// ══════════════════════════════════════════════════════════════════
async function sendInteractive(conn, from, mek, { imageUrl, caption, buttons }) {
  try {
    let header;
    try {
      const imgBuf = await getBuffer(imageUrl);
      const media = await prepareWAMessageMedia(
        { image: imgBuf },
        { upload: conn.waUploadToServer }
      );
      header = proto.Message.InteractiveMessage.Header.fromObject({
        hasMediaAttachment: true,
        ...media
      });
    } catch (imgErr) {
      header = proto.Message.InteractiveMessage.Header.fromObject({
        title: '', hasMediaAttachment: false
      });
    }

    const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
      body: proto.Message.InteractiveMessage.Body.fromObject({ text: caption }),
      footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: GLOBAL_FOOTER }),
      header,
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons })
    });

    const waMsg = generateWAMessageFromContent(from, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadataVersion: 2,
            deviceListMetadata: {}
          },
          interactiveMessage
        }
      }
    }, { quoted: mek, userJid: conn.user.id });

    await conn.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });
    return true;
  } catch (e) {
    console.error('[MENU BUTTON SEND ERROR]', e);
    try {
      const imgBuf = await getBuffer(imageUrl);
      await conn.sendMessage(from, { image: imgBuf, caption, mimetype: 'image/jpeg' }, { quoted: mek });
    } catch {
      await conn.sendMessage(from, { text: caption }, { quoted: mek });
    }
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════
// STAGE RENDERERS — shared by the initial command and button taps
// ══════════════════════════════════════════════════════════════════

async function sendMainMenuUI(conn, mek, sender, from, prefix, pushname) {
  const cats = groupByCategory();
  const { text: catList, keys } = buildCategoryList(cats);

  menuState.set(sender, { stage: 'main', keys, cats, prefix });
  scheduleExpiry(sender);

  const uptime = Math.floor(process.uptime());
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const totalMemory = Math.round(os.totalmem() / 1024 / 1024);

  let menuText = ``;
  menuText += `👋 𝙷𝚎𝚢 ${pushname || 'User'} 𝚆𝚎𝚕𝚌𝚘𝚖𝚎 𝚃𝚘 𝚣𝚎𝚝𝚊\n`;
  menuText += `╭━━━〔『BOT』『MENU』〕━✦\n`;
  menuText += `│  👾 \`Bot\`      : ${BOT_NAME}\n`;
  menuText += `│  📞 \`Owner\`    : ${OWNER_NAME}\n`;
  menuText += `│  🌀 \`Uptime\`   : ${hours}h ${minutes}m ${seconds}s\n`;
  menuText += `│  🧠 \`RAM\`      : ${usedMemory}MB / ${totalMemory}MB\n`;
  menuText += `╰────────────╯\n\n`;
  menuText += `╔═══════════════════╗\n`;
  menuText += `    📂  *SELECT A CATEGORY*   \n`;
  menuText += `╚═══════════════════╝\n`;
  menuText += catList;
  menuText += ` ┗━━━━━━━━━━━━✨\n`;
  menuText += `📝 *Tap a category below, or reply with its number.*\n`;
  menuText += GLOBAL_FOOTER;

  await sendInteractive(conn, from, mek, {
    imageUrl: CAT_IMAGES[''],
    caption: menuText,
    buttons: catButtons(cats, keys, sender)
  });
}

async function openCategoryUI(conn, mek, sender, from, state, catName, cmds) {
  menuState.set(sender, { ...state, stage: 'category', catName, cmds });
  scheduleExpiry(sender);

  const reactionEmoji = CAT_REACTS[catName.toLowerCase()] || CAT_REACTS['other'];
  await conn.sendMessage(from, { react: { text: reactionEmoji, key: mek.key } });

  const listText = buildCmdList(cmds, catName, state.prefix);
  const catImgUrl = CAT_IMAGES[catName.toLowerCase()] || CAT_IMAGES[''];

  await sendInteractive(conn, from, mek, {
    imageUrl: catImgUrl,
    caption: listText,
    buttons: cmdButtons(cmds, catName, state.prefix, sender)
  });
}

async function openDetailUI(conn, mek, sender, from, state, c, catName) {
  menuState.set(sender, { ...state, stage: 'detail', cmd: c, catName });
  scheduleExpiry(sender);

  await conn.sendMessage(from, { react: { text: '📌', key: mek.key } });

  const detailText = buildCmdDetail(c, state.prefix);
  const detailImgUrl = CAT_IMAGES['detail'] || CAT_IMAGES[''];

  await sendInteractive(conn, from, mek, {
    imageUrl: detailImgUrl,
    caption: detailText,
    buttons: detailButtons(catName, sender)
  });
}

async function backToCategoryUI(conn, mek, sender, from, state) {
  if (!state.catName || !state.cmds) return;
  menuState.set(sender, { ...state, stage: 'category' });
  scheduleExpiry(sender);

  const listText = buildCmdList(state.cmds, state.catName, state.prefix);
  const catImgUrl = CAT_IMAGES[state.catName.toLowerCase()] || CAT_IMAGES[''];

  await sendInteractive(conn, from, mek, {
    imageUrl: catImgUrl,
    caption: listText,
    buttons: cmdButtons(state.cmds, state.catName, state.prefix, sender)
  });
}

// ══════════════════════════════════════════════════════════════════
// MAIN MENU COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'menu',
  alias: ['help', 'cmds', 'commands'],
  desc: 'Interactive bot menu with image',
  category: 'main',
  react: '📁',
  filename: __filename
}, async (conn, mek, m, { sender, from, pushname, prefix, reply }) => {
  try {
    if (!isUserLoaded(sender)) await initEnvsettings(sender);
    await sendMainMenuUI(conn, mek, sender, from, prefix, pushname);
  } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// ══════════════════════════════════════════════════════════════════
// NAVIGATION LISTENER — real button taps + legacy numbered replies
// ══════════════════════════════════════════════════════════════════
cmd({
  on: 'body',
  dontAddCommandList: true,
  filename: __filename
}, async (conn, mek, m, { sender, body, from, reply, prefix }) => {
  try {
    if (!menuState.has(sender)) return;

    const raw = (body || '').trim();
    const state = menuState.get(sender);

    // ── Real button taps (native-flow ids from sendInteractive) ────
    if (raw.startsWith('menu_cat::') || raw.startsWith('menu_cmd::') || raw.startsWith('menu_back::')) {
      const parts = raw.split('::');
      const kind = parts[0];
      const ownerId = parts[parts.length - 1];
      if (ownerId !== sender) return; // only the requester can drive their own session
      console.log('[MENU BUTTON TAP]', { raw, sender });

      if (kind === 'menu_back') {
        const target = parts[1];
        if (target === 'main') return sendMainMenuUI(conn, mek, sender, from, state.prefix, mek.pushName || 'User');
        if (target === 'category') return backToCategoryUI(conn, mek, sender, from, state);
        return;
      }

      if (kind === 'menu_cat') {
        const catName = parts[1];
        const cmds = state.cats?.[catName];
        if (!cmds) return;
        return openCategoryUI(conn, mek, sender, from, state, catName, cmds);
      }

      if (kind === 'menu_cmd') {
        const catName = parts[1];
        const idx = parseInt(parts[2]);
        const cmds = state.cats?.[catName];
        const c = cmds?.[idx];
        if (!c) return;
        return openDetailUI(conn, mek, sender, from, state, c, catName);
      }
      return;
    }

    // ── Legacy fallback: plain numbered-text replies (unchanged) ───
    const input = raw;
    if (input === '0') return;

    if (state.stage === 'main') {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > state.keys.length) return;
      const catName = state.keys[num - 1];
      const cmds = state.cats[catName];
      return openCategoryUI(conn, mek, sender, from, state, catName, cmds);
    }

    if (state.stage === 'category') {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > state.cmds.length) return;
      const c = state.cmds[num - 1];
      return openDetailUI(conn, mek, sender, from, state, c, state.catName);
    }

    if (state.stage === 'detail') {
      const num = parseInt(input);
      if (isNaN(num)) return;
      return backToCategoryUI(conn, mek, sender, from, state);
    }

  } catch (e) {
    console.error('[MENU NAV ERROR]', e);
  }
});

// ══════════════════════════════════════════════════════════════════
// ALIVE COMMAND — Hacker Font Backticks + Image + Reply + Global Footer
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'alive',
  alias: ['status', 'bot'],
  desc: 'Check if bot is alive',
  category: 'main',
  react: '❤️‍🩹',
  filename: __filename
}, async (conn, mek, m, { from, pushname, reply }) => {
  try {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const min = Math.floor((uptime % 3600) / 60);
    const sec = Math.floor(uptime % 60);
    const totalCmds = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

    let text = `╭━━━〔『BOT』『STATUS』〕━✦\n`;
    text += `│  🟢 \`Status\`   : Online & Running\n`;
    text += `│  🤖 \`Bot\`      : ${BOT_NAME} v${BOT_VERSION}\n`;
    text += `│  👋 \`Owner\`     : ${OWNER_NAME}\n`;
    text += `│  ⏱️ \`Uptime\`   : ${h}h ${min}m ${sec}s\n`;
    text += `│  📊 \`Cmds\`     : ${totalCmds}\n`;
    text += `╰────────────╯\n\n`;
    text += `_💡 Use \`.menu\` to open the interactive UI_\n`;
    text += GLOBAL_FOOTER;

    try {
      const imgBuf = await getBuffer(CAT_IMAGES['']);
      await conn.sendMessage(from, {
        image: imgBuf,
        caption: text,
        mimetype: 'image/jpeg'
      }, { quoted: mek });
    } catch {
      reply(text);
    }
  } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// ══════════════════════════════════════════════════════════════════
// HELP COMMAND — Image + Reply + Global Footer
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
    if (!q) return reply(`❌ Usage: /how <command name>\nExample: /how ytmp3`);
    const name = q.toLowerCase().replace(/^[^a-z0-9]/g, '');
    const found = commands.find(c =>
      c.pattern === name ||
      (c.alias && c.alias.includes(name))
    );
    if (!found) return reply(`❌ Command *${name}* not found.\nUse \`/menu\` to browse all commands.`);
    
    const detailText = buildCmdDetail(found, prefix);
    const detailImgUrl = CAT_IMAGES['detail'] || CAT_IMAGES['other'];

    try {
      const imgBuf = await getBuffer(detailImgUrl);
      await conn.sendMessage(from, {
        image: imgBuf,
        caption: detailText,
        mimetype: 'image/jpeg'
      }, { quoted: mek });
    } catch {
      reply(detailText);
    }
  } catch (e) { reply(`❌ Error: ${e.message}`); }
});
