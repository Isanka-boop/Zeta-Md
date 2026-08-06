const { cmd } = require('../command');

let cd = new Set();

const replies = [
    "*කවුද හුත්තෝ බඩුව කියලා?* 🤨",
    "*නෙත්මි බඩුව* 😂",
    "*මෙහෙ බඩුවක් නෑ... ඉන්නේ ඔයා විතරයි* 😏",
    "*සවනි බඩුව* 😂"
];

const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Baduwa King 👑
ORG:Baduwa Company;
TEL;type=CELL;type=VOICE;waid=94771234567:+94 77 123 4567
EMAIL:baduwa.king@fake.com
END:VCARD`;

// MAIN
cmd({
    pattern: "baduwa",
    alias: ["badu"],
    react: "🖕",
    category: "fun",
    filename: __filename
},
async (robin, mek) => {
    const from = mek.key.remoteJid;
    const sender = mek.key.participant || mek.key.remoteJid;

    if(cd.has(sender)) return;
    cd.add(sender);
    setTimeout(() => cd.delete(sender), 2000);

    const random = replies[Math.random() * replies.length | 0];
    const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const text = mentionedJid.length? `@${mentionedJid[0].split("@")[0]} ${random}` : random;

    // LIST MESSAGE - 100% වැඩ
    const msg = {
        image: { url: '' },
        caption: text + "\n\n > ᴢᴇᴛᴀ 〽️𝓲𝓷𝓲",
        footer: "Baduwa Bot",
        templateButtons: [
            { index: 1, urlButton: { displayText: 'GitHub', url: 'https://github.com' } }, // උදාහරණයක්
        ],
        interactiveButtons: [ // අලුත්ම format
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "තව 😏", id: ".baduwa" }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Vcard 📇", id: "send_baduwa_vcard" }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Direct", id: ".baduvacard" }) }
        ],
        mentions: mentionedJid
    };

    await robin.sendMessage(from, { react: { text: "😏", key: mek.key } });
    await robin.sendMessage(from, msg, { quoted: mek });
});

// BUTTON / LIST REPLY HANDLER - 2 දෙකම අල්ලනවා
cmd({ on: "message" }, async (robin, mek) => {
    const type = Object.keys(mek.message)[0];
    const from = mek.key.remoteJid;

    let id = null;
    if(type === "buttonsResponseMessage") id = mek.message.buttonsResponseMessage.selectedButtonId;
    if(type === "interactiveResponseMessage") id = JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id;

    if(id === 'send_baduwa_vcard'){
        await robin.sendMessage(from, {
            contacts: { displayName: "Baduwa King 👑", contacts: [{ displayName: "Baduwa King 👑", vcard }] }
        }, { quoted: mek });
    }
});

// DIRECT VCARD
cmd({
    pattern: "baduvacard",
    react: "📇",
    category: "fun",
    filename: __filename
},
async (robin, mek) => {
    await robin.sendMessage(mek.key.remoteJid, {
        contacts: { displayName: "Baduwa King 👑", contacts: [{ displayName: "Baduwa King 👑", vcard }] }
    }, { quoted: mek });
});
