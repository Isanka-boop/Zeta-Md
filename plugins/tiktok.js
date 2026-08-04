// plugins/ACD_TIKTOK.js — TikTok Downloader (WhiteShadow API + WhatsApp buttons)
const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');
const axios = require('axios');
const config = require('../config');
const {
    proto,
    generateWAMessageFromContent,
    prepareWAMessageMedia
} = require('@whiskeysockets/baileys');

const BOT_NAME = config.BOT_NAME || '𝐙𝐞𝐭𝐚 〽️𝓲𝓷𝓲';
const FOOTER   = config.footer  || '> ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ';

const TIKTOK_IMG   = 'https://files.catbox.moe/chtymz.jpg';
const API_BASE     = 'https://whiteshadow-x-api.onrender.com/api/download/tiktok';
const API_TOKEN    = 'aWK0z4';

// ── Session store: sender -> { video, audio, title, thumb } ───────
const tiktokSession = new Map();

// ── Helper: send image + caption, fallback to text ────────────────
async function sendWithImage(conn, from, mek, imageUrl, caption) {
    try {
        const imgBuf = await getBuffer(imageUrl);
        await conn.sendMessage(from, {
            image: imgBuf,
            caption,
            mimetype: 'image/jpeg'
        }, { quoted: mek });
    } catch (e) {
        await conn.sendMessage(from, { text: caption }, { quoted: mek });
    }
}

// ── Helper: send WhatsApp native quick-reply buttons (with fallback) ──
//
// NOTE: passing `interactiveButtons` straight into conn.sendMessage(...)
// is NOT a content type Baileys' high-level sendMessage() understands —
// it gets silently dropped (no throw), so the person only ever received
// the image/caption with no button at all, which is why "the button
// doesn't work." Real, working native-flow (quick_reply) buttons on
// current WhatsApp need to be built as a raw proto InteractiveMessage
// and sent with conn.relayMessage(). That's what this does now.
async function sendButtons(conn, from, mek, { imageUrl, caption, buttons }) {
    // buttons: [{ id, text }]
    const nativeButtons = buttons.map(b => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id })
    }));

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
            console.error('[TIKTOK BUTTON IMG ERROR]', imgErr.message);
            header = proto.Message.InteractiveMessage.Header.fromObject({
                title: '', hasMediaAttachment: false
            });
        }

        const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.fromObject({ text: caption }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: FOOTER }),
            header,
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: nativeButtons
            })
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
        return;
    } catch (e1) {
        console.error('[TIKTOK BUTTON SEND ERROR]', e1);
        // Last resort: plain numbered text (client has zero button support,
        // or something above genuinely failed) — still usable via "1"/"2" reply.
        try {
            const numbered = buttons.map((b, i) => `*${i + 1}.* ${b.text}`).join('\n');
            await conn.sendMessage(from, {
                text: `${caption}\n\n${numbered}\n\n_Reply with a number._`
            }, { quoted: mek });
        } catch (e2) {
            console.error('[TIKTOK BUTTON FALLBACK SEND ERROR]', e2);
        }
    }
}

// ── Build current date/time line ─────────────────────────────────
function getDateTimeLine() {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Colombo'
    });
    const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo'
    });
    return `┃ \`Time :\` ${time}\n┃ \`Date :\` ${date}`;
}

function headerBox(platform) {
    const top    = '*┏━━━━━━━━━━━━━━✦*';
    const bot    = `*┃ \`Bot Name :\` ${BOT_NAME}*`;
    const time   = getDateTimeLine();
    const plat   = `*┃ \`Platform :\` ${platform}*`;
    const bottom = '*┗━━━━━━━━━━━━━━✦*';
    return `${top}\n${bot}\n${time}\n${plat}\n${bottom}`;
}

function contentBox(lines) {
    const top = '┏━━━━━━━━━━━━━━✦';
    const bottom = '┗━━━━━━━━━━━━━━✦';
    const content = lines.map(line => `┃ ${line}`).join('\n');
    return `${top}\n${content}\n${bottom}`;
}

// ── Parse the WhiteShadow API response into a normalized shape ────
// The API's error shape is confirmed as: { success, result: { code: -1, msg } }
// The success shape isn't documented, so this checks several common
// field names defensively. Adjust the field names below once you see
// a real successful response logged to console.
function parseTiktokResult(json) {
    const r = json?.result || json?.data || json;
    if (!r || r.code === -1 || r.status === false || r.success === false) {
        return { ok: false, msg: r?.msg || json?.msg || 'Unknown error from API' };
    }

    const data = r.data || r;

    const video =
        data.video || data.play || data.nowm || data.no_watermark ||
        data.video_url || data.hdplay || data.download_url || null;

    const audio =
        data.audio || data.music || data.audio_url || data.mp3 || null;

    const title = data.title || data.desc || data.caption || 'TikTok Video';
    const thumb = data.thumbnail || data.cover || data.thumb || TIKTOK_IMG;
    const author = data.author?.nickname || data.author?.unique_id || data.username || null;

    if (!video && !audio) {
        return { ok: false, msg: 'API returned success but no media link was found in the response.' };
    }
    return { ok: true, video, audio, title, thumb, author };
}

// ══════════════════════════════════════════════════════════════════
// TIKTOK COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
    pattern: 'tiktok',
    alias: ['tt', 'ttdl'],
    desc: 'Download TikTok video/audio. Usage: .tiktok <url>',
    category: 'download',
    react: '🎬',
    filename: __filename
}, async (conn, mek, m, { reply, q, from, sender }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🎬', key: mek.key } });

        if (!q) {
            const usageCaption = headerBox('TIKTOK DOWNLOADER') + '\n\n' +
                contentBox([
                    '❏ .tiktok <TikTok URL>',
                    '',
                    'Example:',
                    '  .tiktok https://vt.tiktok.com/abc'
                ]) + '\n\n' + FOOTER;
            return await sendWithImage(conn, from, mek, TIKTOK_IMG, usageCaption);
        }

        const url = q.split(' ')[0].trim();
        if (!url.startsWith('http')) {
            const invalidCaption = headerBox('TIKTOK DOWNLOADER') + '\n\n' +
                contentBox(['⚠️ Please provide a valid TikTok URL.']) + '\n\n' + FOOTER;
            return await sendWithImage(conn, from, mek, TIKTOK_IMG, invalidCaption);
        }

        // Let the user know we're fetching (API can be slow on Render free tier — cold start)
        const waitCaption = headerBox('TIKTOK DOWNLOADER') + '\n\n' +
            contentBox(['⏳ Fetching your video, please wait...']) + '\n\n' + FOOTER;
        await sendWithImage(conn, from, mek, TIKTOK_IMG, waitCaption);

        let json;
        try {
            const { data } = await axios.get(API_BASE, {
                params: { url, apitoken: API_TOKEN },
                timeout: 30000
            });
            json = data;
        } catch (apiErr) {
            console.error('[TIKTOK API ERROR]', apiErr?.response?.data || apiErr.message);
            const failCaption = headerBox('TIKTOK DOWNLOADER') + '\n\n' +
                contentBox([
                    '❌ Failed to reach the download API.',
                    'It may be down or restarting (cold start).',
                    'Please try again in a moment.'
                ]) + '\n\n' + FOOTER;
            return await sendWithImage(conn, from, mek, TIKTOK_IMG, failCaption);
        }

        const parsed = parseTiktokResult(json);
        if (!parsed.ok) {
            console.error('[TIKTOK PARSE FAIL]', JSON.stringify(json));
            const failCaption = headerBox('TIKTOK DOWNLOADER') + '\n\n' +
                contentBox([
                    `❌ ${parsed.msg}`,
                    '',
                    'Double check the link is a valid, public TikTok video URL.'
                ]) + '\n\n' + FOOTER;
            return await sendWithImage(conn, from, mek, TIKTOK_IMG, failCaption);
        }

        tiktokSession.set(sender, {
            video: parsed.video,
            audio: parsed.audio,
            title: parsed.title,
            thumb: parsed.thumb
        });
        setTimeout(() => tiktokSession.delete(sender), 120000);

        const readyLines = [
            `🎬 *${parsed.title}*`,
            parsed.author ? `👤 By: ${parsed.author}` : null,
            '',
            'Select what you want to download:'
        ].filter(Boolean);

        const readyCaption = headerBox('TIKTOK DOWNLOADER') + '\n\n' +
            contentBox(readyLines) + '\n\n' + FOOTER;

        const buttons = [];
        if (parsed.video) buttons.push({ id: `tiktok_dl::video::${sender}`, text: '🎥 Download Video' });
        if (parsed.audio) buttons.push({ id: `tiktok_dl::audio::${sender}`, text: '🎵 Download Audio' });

        await sendButtons(conn, from, mek, {
            imageUrl: parsed.thumb || TIKTOK_IMG,
            caption: readyCaption,
            buttons
        });

    } catch (e) {
        console.error('[TIKTOK CMD ERROR]', e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ══════════════════════════════════════════════════════════════════
// BUTTON TAP LISTENER — sends the actual video/audio file
// ══════════════════════════════════════════════════════════════════
cmd({
    on: 'body',
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { sender, from, body }) => {
    try {
        let selectedId = null;
        const nativeFlow = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        const btnId = m.message?.buttonsResponseMessage?.selectedButtonId;

        if (nativeFlow) {
            try { selectedId = JSON.parse(nativeFlow).id; } catch { }
        } else if (btnId) {
            selectedId = btnId;
        }

        // Fallback: plain "1"/"2" reply when no button support at all
        if (!selectedId && tiktokSession.has(sender)) {
            const input = (body || '').trim();
            const session = tiktokSession.get(sender);
            if (input === '1' && session.video) selectedId = `tiktok_dl::video::${sender}`;
            else if (input === '2' && session.audio) selectedId = `tiktok_dl::audio::${sender}`;
        }

        if (!selectedId || !selectedId.startsWith('tiktok_dl::')) return;
        console.log('[TIKTOK BUTTON TAP]', { selectedId, sender });

        const [, type, ownerId] = selectedId.split('::');
        if (ownerId !== sender) return; // only the requester can trigger their own session

        const session = tiktokSession.get(sender);
        if (!session) {
            return await conn.sendMessage(from, {
                text: '⚠️ This session expired. Please run `.tiktok <url>` again.'
            }, { quoted: mek });
        }

        const mediaUrl = type === 'video' ? session.video : session.audio;
        if (!mediaUrl) return;

        await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

        const buf = await getBuffer(mediaUrl);

        if (type === 'video') {
            await conn.sendMessage(from, {
                video: buf,
                mimetype: 'video/mp4',
                caption: `🎬 *${session.title}*\n${FOOTER}`
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                audio: buf,
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: mek });
        }

    } catch (e) {
        console.error('[TIKTOK DOWNLOAD ERROR]', e);
    }
});
