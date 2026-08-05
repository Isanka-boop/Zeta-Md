// plugins/pinterest.js — Pinterest Downloader (SasaTech API + real WhatsApp buttons)
const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');
const axios = require('axios');
const config = require('../config');
const {
    proto,
    generateWAMessageFromContent,
    prepareWAMessageMedia
} = require('@whiskeysockets/baileys');

const BOT_NAME  = config.BOT_NAME || '𝐙𝐞𝐭𝐚 〽️𝓲𝓷𝓲';
const FOOTER    = config.footer  || '> ᴘɪɴᴛᴇʀᴇꜱᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ';

const PIN_IMG   = 'https://files.catbox.moe/chtymz.jpg';
const API_BASE  = 'https://api.sasatech.online/api/v1/pinterest/download';
const API_KEY   = 'fde2165c3c244df6e5d59790a0ef80a9bff360e9c4ee1c0f';

// ── Session store: sender -> { items: [{label,url,type}], title } ─
const pinSession = new Map();

// ══════════════════════════════════════════════════════════════════
// PRETTY (bold) UI BUILDERS — same box style as the rest of the bot
// ══════════════════════════════════════════════════════════════════
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
    const content = lines.map(line => `┃ *${line}*`).join('\n');
    return `${top}\n${content}\n${bottom}`;
}

async function sendWithImage(conn, from, mek, imageUrl, caption) {
    try {
        const imgBuf = await getBuffer(imageUrl);
        await conn.sendMessage(from, {
            image: imgBuf, caption, mimetype: 'image/jpeg'
        }, { quoted: mek });
    } catch (e) {
        await conn.sendMessage(from, { text: caption }, { quoted: mek });
    }
}

// ══════════════════════════════════════════════════════════════════
// sendInteractive — real native-flow buttons via relayMessage
// (the same proven approach used in tiktok.js / ACD_MENU.js — the
// old `interactiveButtons` shortcut on sendMessage() silently does
// nothing on this Baileys version).
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
                hasMediaAttachment: true, ...media
            });
        } catch {
            header = proto.Message.InteractiveMessage.Header.fromObject({
                title: '', hasMediaAttachment: false
            });
        }

        const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.fromObject({ text: caption }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: FOOTER }),
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
        console.error('[PINTEREST BUTTON SEND ERROR]', e);
        const numbered = buttons
            .filter(b => b.name === 'quick_reply')
            .map((b, i) => `*${i + 1}.* ${JSON.parse(b.buttonParamsJson).display_text}`)
            .join('\n');
        await sendWithImage(conn, from, mek, imageUrl, `${caption}\n\n${numbered}\n\n_Reply with a number._`);
        return false;
    }
}

// ══════════════════════════════════════════════════════════════════
// Parse the SasaTech API response into a normalized list of
// downloadable items. The exact field names aren't documented, so
// this checks several common shapes defensively. If parsing fails,
// the raw JSON is logged to console — check that log and adjust the
// field names below to match the real response once you see it.
// ══════════════════════════════════════════════════════════════════
function parsePinterestResult(json) {
    const r = json?.result || json?.data || json;
    if (!r || json?.status === false || json?.success === false || r?.error) {
        return { ok: false, msg: r?.message || r?.msg || json?.message || 'Unknown error from API' };
    }

    const title = r.title || r.desc || r.description || 'Pinterest Pin';
    const items = [];

    // Video pin
    const video = r.video || r.video_url || r.video_hd || r.hd_video;
    if (video) items.push({ label: '🎬 Video', url: video, type: 'video' });

    // Multiple image qualities (object of resolution -> url, e.g. {orig, "736x", "474x"})
    const images = r.images || r.image_qualities || r.sizes;
    if (images && typeof images === 'object' && !Array.isArray(images)) {
        for (const [key, url] of Object.entries(images)) {
            if (typeof url === 'string') {
                items.push({ label: `🖼️ Image (${key})`, url, type: 'image' });
            }
        }
    }

    // Single best image fallback
    if (!items.some(i => i.type === 'image')) {
        const image = r.image || r.orig || r.original || r.hd_image ||
            r.image_url || r.download_url || r.url || r.thumbnail;
        if (image) items.push({ label: '🖼️ Image (Best Quality)', url: image, type: 'image' });
    }

    if (items.length === 0) {
        return { ok: false, msg: 'API returned success but no downloadable media was found in the response.' };
    }
    return { ok: true, title, items, thumb: items.find(i => i.type === 'image')?.url || PIN_IMG };
}

// ══════════════════════════════════════════════════════════════════
// PINTEREST COMMAND
// ══════════════════════════════════════════════════════════════════
cmd({
    pattern: 'pinterest',
    alias: ['pin', 'pint'],
    desc: 'Download Pinterest image/video in the best quality. Usage: .pinterest <url>',
    category: 'download',
    react: '📌',
    filename: __filename
}, async (conn, mek, m, { reply, q, from, sender }) => {
    try {
        await conn.sendMessage(from, { react: { text: '📌', key: mek.key } });

        if (!q) {
            const usageCaption = headerBox('PINTEREST DOWNLOADER') + '\n\n' +
                contentBox([
                    '❏ .pinterest <Pinterest URL>',
                    '',
                    'Example:',
                    '  .pinterest https://pin.it/abc123'
                ]) + '\n\n' + FOOTER;
            return await sendWithImage(conn, from, mek, PIN_IMG, usageCaption);
        }

        const url = q.split(' ')[0].trim();
        if (!url.startsWith('http')) {
            const invalidCaption = headerBox('PINTEREST DOWNLOADER') + '\n\n' +
                contentBox(['⚠️ Please provide a valid Pinterest URL.']) + '\n\n' + FOOTER;
            return await sendWithImage(conn, from, mek, PIN_IMG, invalidCaption);
        }

        const waitCaption = headerBox('PINTEREST DOWNLOADER') + '\n\n' +
            contentBox(['⏳ Fetching your pin, please wait...']) + '\n\n' + FOOTER;
        await sendWithImage(conn, from, mek, PIN_IMG, waitCaption);

        let json;
        try {
            const { data } = await axios.get(API_BASE, {
                params: { url },
                headers: { 'x-api-key': API_KEY },
                timeout: 30000
            });
            json = data;
        } catch (apiErr) {
            console.error('[PINTEREST API ERROR]', apiErr?.response?.data || apiErr.message);
            const failCaption = headerBox('PINTEREST DOWNLOADER') + '\n\n' +
                contentBox([
                    '❌ Failed to reach the download API.',
                    'Please try again in a moment.'
                ]) + '\n\n' + FOOTER;
            return await sendWithImage(conn, from, mek, PIN_IMG, failCaption);
        }

        const parsed = parsePinterestResult(json);
        if (!parsed.ok) {
            console.error('[PINTEREST PARSE FAIL]', JSON.stringify(json));
            const failCaption = headerBox('PINTEREST DOWNLOADER') + '\n\n' +
                contentBox([
                    `❌ ${parsed.msg}`,
                    '',
                    'Double check the link is a valid, public Pinterest pin URL.'
                ]) + '\n\n' + FOOTER;
            return await sendWithImage(conn, from, mek, PIN_IMG, failCaption);
        }

        // Only one item found — just send it straight away, no need for buttons.
        if (parsed.items.length === 1) {
            return await deliverItem(conn, from, mek, parsed.items[0], parsed.title);
        }

        pinSession.set(sender, { items: parsed.items, title: parsed.title });
        setTimeout(() => pinSession.delete(sender), 120000);

        const readyLines = [
            `📌 *${parsed.title}*`,
            '',
            'Select the quality you want to download:'
        ];
        const readyCaption = headerBox('PINTEREST DOWNLOADER') + '\n\n' +
            contentBox(readyLines) + '\n\n' + FOOTER;

        const rows = parsed.items.map((item, i) => ({
            title: item.label,
            id: `pin_dl::${i}::${sender}`,
            description: item.type === 'video' ? 'Video file' : 'Image file'
        }));
        const buttons = [{
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
                title: '📥 Tap to choose quality',
                sections: [{ title: 'Available downloads', rows }]
            })
        }];

        await sendInteractive(conn, from, mek, {
            imageUrl: parsed.thumb,
            caption: readyCaption,
            buttons
        });

    } catch (e) {
        console.error('[PINTEREST CMD ERROR]', e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ── Actually deliver a chosen item as a real image/video message ──
async function deliverItem(conn, from, mek, item, title) {
    await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });
    const buf = await getBuffer(item.url);
    if (item.type === 'video') {
        await conn.sendMessage(from, {
            video: buf, mimetype: 'video/mp4',
            caption: `📌 *${title}*\n${FOOTER}`
        }, { quoted: mek });
    } else {
        await conn.sendMessage(from, {
            image: buf, mimetype: 'image/jpeg',
            caption: `📌 *${title}*\n${FOOTER}`
        }, { quoted: mek });
    }
}

// ══════════════════════════════════════════════════════════════════
// BUTTON TAP LISTENER — sends the chosen quality/format
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

        // Fallback: plain "1"/"2"/... reply when no button support at all
        if (!selectedId && pinSession.has(sender)) {
            const input = (body || '').trim();
            const num = parseInt(input);
            const session = pinSession.get(sender);
            if (!isNaN(num) && num >= 1 && num <= session.items.length) {
                selectedId = `pin_dl::${num - 1}::${sender}`;
            }
        }

        if (!selectedId || !selectedId.startsWith('pin_dl::')) return;
        console.log('[PINTEREST BUTTON TAP]', { selectedId, sender });

        const [, idxStr, ownerId] = selectedId.split('::');
        if (ownerId !== sender) return;

        const session = pinSession.get(sender);
        if (!session) {
            return await conn.sendMessage(from, {
                text: '⚠️ This session expired. Please run `.pinterest <url>` again.'
            }, { quoted: mek });
        }

        const item = session.items[parseInt(idxStr)];
        if (!item) return;

        await deliverItem(conn, from, mek, item, session.title);

    } catch (e) {
        console.error('[PINTEREST DOWNLOAD ERROR]', e);
    }
});
