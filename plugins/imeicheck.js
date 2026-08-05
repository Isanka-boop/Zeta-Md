// plugins/ACD_IMEICHECK.js — IMEI Checker (Matches ACD_MENU Style)
const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════════
const API_BASE  = 'https://whiteshadow-x-api.onrender.com/api/tools/imeicheck';
const API_TOKEN = 'aWK0z4';
const BOT_NAME  = 'ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲';

// ── Global Footer (Same as ACD_MENU.js) ─────────────────────────
const GLOBAL_FOOTER = `\n╭─────𓆩★𓆪──────╮\n> 𝙿σ𝚆є𝚁є𝙳 𝙱у ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲\n╰─────𓆩★𓆪──────╯`;

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
function isValidImei(str) {
  return /^\d{14,16}$/.test(str);
}

function buildResultText(imei, data) {
  // Unwrap common wrapper shapes: { status, result: {...} } or the object itself
  const r = data?.result || data?.data || data || {};

  let text = ``;
  text += `╭━━━〔 📱 *𝗜𝗠𝗘𝗜 𝗖𝗛𝗘𝗖𝗞* 〕━✦\n`;
  text += `│ 🔢 \`IMEI\`        : ${imei}\n`;

  // Print out any useful fields we can find, without assuming a fixed schema
  const fieldMap = {
    brand: '🏷️ `Brand`',
    model: '📱 `Model`',
    name: '📱 `Name`',
    device: '📱 `Device`',
    status: '✅ `Status`',
    valid: '✅ `Valid`',
    imei2: '🔢 `IMEI2`',
    serial: '🔢 `Serial`',
    tac: '🏭 `TAC`',
    fccid: '🆔 `FCC ID`',
    country: '🌍 `Country`',
    manufacturer: '🏭 `Manufacturer`',
    modelName: '📱 `Model Name`'
  };

  let printed = 0;
  for (const [key, label] of Object.entries(fieldMap)) {
    if (r[key] !== undefined && r[key] !== null && r[key] !== '') {
      text += `│ ${label} : ${r[key]}\n`;
      printed++;
    }
  }

  if (printed === 0) {
    // Fallback — dump whatever came back so nothing is lost
    text += `│ ℹ️ \`Raw Result\`  :\n│ ${JSON.stringify(r).slice(0, 500)}\n`;
  }

  text += `╰────────────╯\n\n`;
  text += `🤖 \`Bot\` : ${BOT_NAME}\n`;
  text += GLOBAL_FOOTER;
  return text;
}

// ══════════════════════════════════════════════════════════════════
// IMEICHECK COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'imeicheck',
  alias: ['imei', 'checkimei'],
  desc: 'Check device details from an IMEI number',
  category: 'tools',
  react: '📱',
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    if (!q) {
      return reply(
        `╭━━━〔 📱 *𝗜𝗠𝗘𝗜 𝗖𝗛𝗘𝗖𝗞* 〕━✦\n` +
        `│ ❌ *IMEI number ekak dila na!*\n` +
        `│ 📝 *Usage:* \`.imeicheck <imei>\`\n` +
        `│ 💡 *Example:* \`.imeicheck 356554448894580\`\n` +
        `╰────────────╯` +
        GLOBAL_FOOTER
      );
    }

    const imei = q.trim();

    if (!isValidImei(imei)) {
      return reply(
        `╭━━━〔 📱 *𝗜𝗠𝗘𝗜 𝗖𝗛𝗘𝗖𝗞* 〕━✦\n` +
        `│ ❌ *IMEI eka wrong-ai!* (14–16 digits ona)\n` +
        `│ 💡 *Example:* \`.imeicheck 356554448894580\`\n` +
        `╰────────────╯` +
        GLOBAL_FOOTER
      );
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    const apiUrl = `${API_BASE}?imei=${encodeURIComponent(imei)}&apitoken=${API_TOKEN}`;

    let data;
    try {
      const res = await axios.get(apiUrl, { timeout: 30000 });
      data = res.data;
    } catch (err) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply(
        `╭━━━〔 📱 *𝗜𝗠𝗘𝗜 𝗖𝗛𝗘𝗖𝗞* 〕━✦\n` +
        `│ ❌ *API eken response ekak nathuwa awa.*\n` +
        `│ 🔁 *Try again later.*\n` +
        `╰────────────╯` +
        GLOBAL_FOOTER
      );
    }

    if (!data || data.status === false) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply(
        `╭━━━〔 📱 *𝗜𝗠𝗘𝗜 𝗖𝗛𝗘𝗖𝗞* 〕━✦\n` +
        `│ ❌ *IMEI eka valid na, or data hoyaganna baaruna.*\n` +
        `╰────────────╯` +
        GLOBAL_FOOTER
      );
    }

    const resultText = buildResultText(imei, data);
    await conn.sendMessage(from, { text: resultText }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (e) {
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }).catch(() => {});
    reply(
      `╭━━━〔 📱 *𝗜𝗠𝗘𝗜 𝗖𝗛𝗘𝗖𝗞* 〕━✦\n` +
      `│ ❌ *Error:* ${e.message}\n` +
      `╰────────────╯` +
      GLOBAL_FOOTER
    );
  }
});
