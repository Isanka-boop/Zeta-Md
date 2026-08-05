// plugins/ACD_TEXT2IMG.js — Text ➜ AI Image Generator (Matches ACD_MENU Style)
const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════════
const API_BASE  = 'https://whiteshadow-x-api.onrender.com/api/ai/text2img';
const API_TOKEN = 'aWK0z4';
const BOT_NAME  = 'ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲';

// ── Global Footer (Same as ACD_MENU.js) ─────────────────────────
const GLOBAL_FOOTER = `\n╭─────𓆩★𓆪──────╮\n> 𝙿σ𝚆є𝚁є𝙳 𝙱у ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲\n╰─────𓆩★𓆪──────╯`;

// ══════════════════════════════════════════════════════════════════
// HELPER — Extract image URL from whatever shape the API returns
// ══════════════════════════════════════════════════════════════════
function extractImageUrl(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  return (
    data.result ||
    data.url ||
    data.image ||
    data.data?.url ||
    data.data?.result ||
    (Array.isArray(data.result) ? data.result[0] : null) ||
    null
  );
}

// ══════════════════════════════════════════════════════════════════
// TEXT2IMG COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
  pattern: 'text2img',
  alias: ['txt2img', 'aiimg', 'imagine'],
  desc: 'Generate an AI image from a text prompt',
  category: 'ai',
  react: '🖼️',
  filename: __filename
}, async (conn, mek, m, { from, reply, q, pushname }) => {
  try {
    if (!q) {
      return reply(
        `╭━━━〔 🖼️ *𝗧𝗘𝗫𝗧𝟮𝗜𝗠𝗚* 〕━✦\n` +
        `│ ❌ *Prompt-ek dila na!*\n` +
        `│ 📝 *Usage:* \`.text2img <prompt>\`\n` +
        `│ 💡 *Example:* \`.text2img a cute cat with sunglasses\`\n` +
        `╰────────────╯` +
        GLOBAL_FOOTER
      );
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    const apiUrl = `${API_BASE}?prompt=${encodeURIComponent(q)}&apitoken=${API_TOKEN}`;

    let imageUrl = null;
    try {
      const { data } = await axios.get(apiUrl, { timeout: 60000 });
      imageUrl = extractImageUrl(data);
    } catch (err) {
      // Some endpoints stream the image directly instead of JSON — fall back to raw URL
      imageUrl = apiUrl;
    }

    if (!imageUrl) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply(
        `╭━━━〔 🖼️ *𝗧𝗘𝗫𝗧𝟮𝗜𝗠𝗚* 〕━✦\n` +
        `│ ❌ *Image ekak hadanna baaruna!*\n` +
        `│ 🔁 *Try again with a different prompt.*\n` +
        `╰────────────╯` +
        GLOBAL_FOOTER
      );
    }

    const imgBuf = await getBuffer(imageUrl);

    let caption = ``;
    caption += `╭━━━〔 🖼️ *𝗔𝗜 𝗧𝗘𝗫𝗧𝟮𝗜𝗠𝗚* 〕━✦\n`;
    caption += `│ 👤 \`Requested by\` : ${pushname}\n`;
    caption += `│ 📝 \`Prompt\`       : *${q}*\n`;
    caption += `│ 🤖 \`Bot\`          : ${BOT_NAME}\n`;
    caption += `╰────────────╯\n\n`;
    caption += `✨ *Image generated successfully!*\n`;
    caption += GLOBAL_FOOTER;

    await conn.sendMessage(from, {
      image: imgBuf,
      caption,
      mimetype: 'image/jpeg'
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (e) {
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }).catch(() => {});
    reply(
      `╭━━━〔 🖼️ *𝗧𝗘𝗫𝗧𝟮𝗜𝗠𝗚* 〕━✦\n` +
      `│ ❌ *Error:* ${e.message}\n` +
      `╰────────────╯` +
      GLOBAL_FOOTER
    );
  }
});
