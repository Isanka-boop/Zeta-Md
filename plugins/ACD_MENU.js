// plugins/ACD_MENU.js — Full Custom UI Bot Menu System (Strict Stage Lockdown)
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
const GLOBAL_FOOTER = `\n╭───────────╮\n> 𝙿σ𝚆є𝚁є𝙳 𝙱у ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲\n╰───────────╯`;

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
  category: 'main',
  react: '🦋',
  filename: __filename
}, async (conn, mek, m, { sender, from, pushname, prefix, reply }) => {
  try {
    if (!isUserLoaded(sender)) await initEnvsettings(sender);

    const cats = groupByCategory();
    const { text: catList, keys } = buildCategoryList(cats);

    menuState.set(sender, { stage: 'main', keys, cats, prefix });
    setTimeout(() => menuState.delete(sender), 120000); // 2 min timeout

    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMemory = Math.round(os.totalmem() / 1024 / 1024);

    let menuText = ``;
    menuText += `👋 𝐇𝐄𝐘 ${pushname} 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐙𝐄𝐓𝐀 🫵\n`;
    
    menuText += `╭━━━〔 𝐙𝐄𝐓𝐀 𝐌𝐄𝐍𝐔〕━✦\n`;
    menuText += `│  👾 \`Bot\`      : ${BOT_NAME}\n`;
    menuText += `│  📞 \`Owner\`    : ${OWNER_NAME}\n`;
    menuText += `│  🌀 \`Uptime\`   : ${hours}h ${minutes}m ${seconds}s\n`;
    menuText += `│  🧠 \`RAM\`      : ${usedMemory}MB / ${totalMemory}MB\n`;
    menuText += `╰────────────╯\n\n`;
    menuText += `╔═══════════════════╗\n`;
    menuText += ` 📂  \`SELECT A CATEGORY\`   \n`;
    menuText += `╚═══════════════════╝\n`;
    menuText += catList;
    menuText += ` ┗━━━━━━━━━━━━✨\n`;
    menuText += `📝 *Reply with the category number.*\n`;
    menuText += GLOBAL_FOOTER;

    try {
      const imgBuf = await getBuffer(CAT_IMAGES['']);
      await conn.sendMessage(from, {
        image: imgBuf,
        caption: menuText,
        mimetype: 'image/jpeg'
      }, { quoted: mek });
    } catch {
      await conn.sendMessage(from, { text: menuText }, { quoted: mek });
    }

  } catch (e) { reply(`❌ Error: ${e.message}`); }
});

// ══════════════════════════════════════════════════════════════════
// NUMBER REPLY LISTENER — Handles menu navigation (Strict Stage Lockdown)
// ══════════════════════════════════════════════════════════════════
cmd({
  on: 'body',
  dontAddCommandList: true,
  filename: __filename
}, async (conn, mek, m, { sender, body, from, reply, prefix }) => {
  try {
    if (!menuState.has(sender)) return;

    const input = body.trim();
    const state = menuState.get(sender);

    // 0 அழுத்தினால் எந்த ரியாக்‌ஷனும் நடக்காது (முற்றிலும் புறக்கணிக்கப்படும்)
    if (input === '0') return;

    // ── Stage: main → select category ────────────────────────────
    if (state.stage === 'main') {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > state.keys.length) return;

      const catName = state.keys[num - 1];
      const cmds    = state.cats[catName];
      
      // Stage மாறும்: இனி மெயின் மெனு எண்கள் வேலை செய்யாது
      menuState.set(sender, { ...state, stage: 'category', catName, cmds });

      const reactionEmoji = CAT_REACTS[catName.toLowerCase()] || CAT_REACTS['other'];
      await conn.sendMessage(from, { react: { text: reactionEmoji, key: mek.key } });

      const listText = buildCmdList(cmds, catName, state.prefix);
      const catImgUrl = CAT_IMAGES[catName.toLowerCase()] || CAT_IMAGES['other'];

      try {
        const imgBuf = await getBuffer(catImgUrl);
        await conn.sendMessage(from, {
          image: imgBuf,
          caption: listText,
          mimetype: 'image/jpeg'
        }, { quoted: mek });
      } catch {
        reply(listText);
      }
      return;
    }

    // ── Stage: category → select command ─────────────────────────
    if (state.stage === 'category') {
      const num = parseInt(input);
      // ஓபனில் இருக்கும் கேட்டகரியின் கமாண்ட் எண்ணிக்கையை தாண்டி அழுத்தினால் block ஆகும்
      if (isNaN(num) || num < 1 || num > state.cmds.length) return;

      const cmd  = state.cmds[num - 1];
      menuState.set(sender, { ...state, stage: 'detail', cmd });

      await conn.sendMessage(from, { react: { text: '📌', key: mek.key } });

      const detailText = buildCmdDetail(cmd, state.prefix);
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
      return;
    }

    // ── Stage: detail → Show category list again with Image + Reply ──
    if (state.stage === 'detail') {
      const num = parseInt(input);
      if (isNaN(num)) return;
      
      const listText = buildCmdList(state.cmds, state.catName, state.prefix);
      menuState.set(sender, { ...state, stage: 'category' });

      const catImgUrl = CAT_IMAGES[state.catName.toLowerCase()] || CAT_IMAGES['other'];

      try {
        const imgBuf = await getBuffer(catImgUrl);
        await conn.sendMessage(from, {
          image: imgBuf,
          caption: listText,
          mimetype: 'image/jpeg'
        }, { quoted: mek });
      } catch {
        reply(listText);
      }
      return;
    }

  } catch (e) {
    console.error('[MENU NAV ERROR]', e);
  }
});

// ══════════════════════════════════════════════════════════════════
// sendAliveButtons — real native-flow quick_reply buttons via
// relayMessage (same proven approach used across the bot, e.g.
// pinterest.js / tiktok.js). The `id` of each quick_reply button is
// the full command text (e.g. ".menu"), and pair.js already unpacks
// interactiveResponseMessage → nativeFlowResponseMessage.paramsJson.id
// as the message body, so tapping a button re-runs that command
// exactly as if the user had typed it — no extra response handler
// needed.
// ══════════════════════════════════════════════════════════════════
async function sendAliveButtons(conn, from, mek, { imageUrl, caption, footer, buttons }) {
  try {
    let header;
    try {
      const imgBuf = await getBuffer(imageUrl);
      const media = await prepareWAMessageMedia(
        { image: imgBuf },
        { upload: conn.waUploadToServer }
      );
      header = proto.Message.InteractiveMessage.Header.fromObject({
        hasMediaAttachment: true, ...media
      });
    } catch {
      header = proto.Message.InteractiveMessage.Header.fromObject({
        title: '', hasMediaAttachment: false
      });
    }

    const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
      body: proto.Message.InteractiveMessage.Body.fromObject({ text: caption }),
      footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: footer }),
      header,
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons })
    });

    const waMsg = generateWAMessageFromContent(from, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
          interactiveMessage
        }
      }
    }, { quoted: mek, userJid: conn.user.id });

    await conn.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });
    return true;
  } catch (e) {
    console.error('[ALIVE BUTTON SEND ERROR]', e);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════
// ALIVE COMMAND — Hacker Font Backticks + Image + Reply + Global Footer
//                  + .menu / .ping quick-reply buttons
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'alive',
  alias: ['status', 'bot'],
  desc: 'Check if bot is alive',
  category: 'main',
  react: '🚀',
  filename: __filename
}, async (conn, mek, m, { from, pushname, reply, prefix }) => {
  try {
    const px = prefix || '.';
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const min = Math.floor((uptime % 3600) / 60);
    const sec = Math.floor(uptime % 60);
    const totalCmds = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

    let text = `╭━━━〔 𝐀𝐋𝐈𝐕𝐄 〕━✦\n`;
    text += `│  🟢 \`Status\`   : Online & Running\n`;
    text += `│  🤖 \`Bot\`      : ${BOT_NAME} v${BOT_VERSION}\n`;
    text += `│  👋 \`Owner\`     : ${OWNER_NAME}\n`;
    text += `│  ⏱️ \`Uptime\`   : ${h}h ${min}m ${sec}s\n`;
    text += `│  📊 \`Cmds\`     : ${totalCmds}\n`;
    text += `╰────────────╯\n\n`;
    text += `_💡 Tap a button below, or use \`${px}menu\` to open the interactive UI_\n`;
    text += GLOBAL_FOOTER;

    const buttons = [
      { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📋 Menu', id: `${px}menu` }) },
      { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🏓 Ping', id: `${px}ping` }) }
    ];

    const sent = await sendAliveButtons(conn, from, mek, {
      imageUrl: CAT_IMAGES['alive'],
      caption: text,
      footer: GLOBAL_FOOTER,
      buttons
    });

    if (!sent) {
      // Fallback: plain image/text reply with a typed-command hint
      try {
        const imgBuf = await getBuffer(CAT_IMAGES['alive']);
        await conn.sendMessage(from, {
          image: imgBuf,
          caption: text + `\n\n_(👉 ${px}menu  |  ${px}ping)_`,
          mimetype: 'image/jpeg'
        }, { quoted: mek });
      } catch {
        reply(text + `\n\n_(👉 ${px}menu  |  ${px}ping)_`);
      }
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
