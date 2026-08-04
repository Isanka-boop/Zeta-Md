// plugins/ai_image.js — Premium AI Image Generator UI v3.1
const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');
const axios = require('axios');

// ── CONFIG ─────────────────────────────────────────
const AI_IMAGES = {
  loading: 'https://files.catbox.moe/chtymz.jpg',
  success: 'https://files.catbox.moe/chtymz.jpg',
  error:   'https://files.catbox.moe/chtymz.jpg',
};

const BOT_NAME = '𝐙𝐞𝐭𝐚 〽️𝓲𝓷𝓲';
const BOT_VER  = 'v3.1';

// ── HELPERS ────────────────────────────────────────
async function sendWithImage(conn, from, mek, imageUrl, caption) {
  try {
    const imgBuf = await getBuffer(imageUrl);
    return await conn.sendMessage(
      from,
      { image: imgBuf, caption, mimetype: 'image/jpeg' },
      { quoted: mek }
    );
  } catch {
    return await conn.sendMessage(from, { text: caption }, { quoted: mek });
  }
}

// ── STYLE FACTORY ───────────────────────────────────
function box(tl, tr, bl, br, h, v) {
  return {
    loading: (title, body) =>
      `${tl}${h.repeat(12)}${tr}\n` +
      `${v} ${title} ${v}\n` +
      `${bl}${h.repeat(12)}${br}\n` +
      body +
      `\n\n⚡ ${BOT_NAME} ${BOT_VER}`,

    success: (title, prompt, time) =>
      `╭━━━━━━━━━━━━━━╮\n` +
      `│ 🎨 ${title}\n` +
      `╰━━━━━━━━━━━━━━╯\n\n` +
      `╭─❍ PROMPT\n│ ${prompt}\n╰────────────\n\n` +
      `╭─❍ DETAILS\n│ Status : Success\n│ Time   : ${time}s\n╰────────────\n\n` +
      `━━━━━━━━━━━━━━━\n ✦ ${BOT_NAME} ✦\n━━━━━━━━━━━━━━━`,

    error: (msg) =>
      `╭━━━━━━━━━━━━━━╮\n` +
      `│ ❌ FAILED\n` +
      `╰━━━━━━━━━━━━━━╯\n\n` +
      `${msg}\n\n━━━━━━━━━━━━━━━\n ${BOT_NAME}`
  };
}

const fluxStyle = box('╔','╗','╚','╝','═','║');
const txtStyle  = box('┏','┓','┗','┛','━','┃');

// ── RANDOM LOADING TEXT ────────────────────────────
const loadingQuotes = [
  '🎨 Initializing AI Engine...',
  '🧠 Building Scene...',
  '⚡ Rendering Masterpiece...',
  '🌌 Creating Visual World...',
  '✨ Finalizing Artwork...'
];

// ───────────────────────────────────────────────────
// FLUX IMAGE
// ───────────────────────────────────────────────────
cmd({
  pattern: "fluximg",
  category: "ai",
  react: "🎨",
  desc: "Flux AI image generator",
  use: "<prompt>",
  filename: __filename
}, async (conn, mek, m, { q, from }) => {
  try {
    if (!q) {
      return sendWithImage(
        conn,
        from,
        mek,
        AI_IMAGES.error,
        fluxStyle.error("❌ Provide prompt!\nExample: .fluximg cyber city")
      );
    }

    const start = Date.now();

    const loadText =
      fluxStyle.loading(
        "FLUX AI ENGINE",
        `▰▱▱▱▱▱▱▱▱▱ 10%\n${loadingQuotes[Math.floor(Math.random()*loadingQuotes.length)]}`
      );

    const loadMsg = await sendWithImage(conn, from, mek, AI_IMAGES.loading, loadText);
    const loadKey = loadMsg?.key;

    const { data } = await axios.get(
      `https://api.giftedtech.co.ke/api/ai/fluximg?apikey=gifted&prompt=${encodeURIComponent(q)}`
    );

    const end = ((Date.now() - start) / 1000).toFixed(1);

    if (data?.result?.url) {
      if (loadKey) await conn.sendMessage(from, { delete: loadKey });

      const caption = fluxStyle.success("FLUX IMAGE", q, end);

      await sendWithImage(
        conn,
        from,
        mek,
        data.result.url,
        caption
      );
    } else throw new Error("No image URL");
  } catch (e) {
    console.log(e);
    return sendWithImage(
      conn,
      from,
      mek,
      AI_IMAGES.error,
      fluxStyle.error("Unable to generate image. Try again later.")
    );
  }
});

// ───────────────────────────────────────────────────
// TXT2IMG
// ───────────────────────────────────────────────────
cmd({
  pattern: "txt2img",
  category: "ai",
  react: "🖼️",
  desc: "Text to image AI",
  use: "<prompt>",
  filename: __filename
}, async (conn, mek, m, { q, from }) => {
  try {
    if (!q) {
      return sendWithImage(
        conn,
        from,
        mek,
        AI_IMAGES.error,
        txtStyle.error("❌ Provide prompt")
      );
    }

    const start = Date.now();

    const loadMsg = await sendWithImage(
      conn,
      from,
      mek,
      AI_IMAGES.loading,
      fluxStyle.loading(
        "TXT2IMG ENGINE",
        `▰▱▱▱▱▱▱▱▱▱ 10%\n${loadingQuotes[Math.floor(Math.random()*loadingQuotes.length)]}`
      )
    );

    const loadKey = loadMsg?.key;

    const { data } = await axios.get(
      `https://api.giftedtech.co.ke/api/ai/txt2img?apikey=gifted&prompt=${encodeURIComponent(q)}`
    );

    const end = ((Date.now() - start) / 1000).toFixed(1);

    if (data?.result?.url) {
      if (loadKey) await conn.sendMessage(from, { delete: loadKey });

      const caption = txtStyle.success("GENERATED IMAGE", q, end);

      await sendWithImage(conn, from, mek, data.result.url, caption);
    } else throw new Error();
  } catch (e) {
    console.log(e);
    return sendWithImage(
      conn,
      from,
      mek,
      AI_IMAGES.error,
      txtStyle.error("Failed to generate image. Retry later.")
    );
  }
});