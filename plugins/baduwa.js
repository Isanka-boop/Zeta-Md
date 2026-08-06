const { cmd } = require('../command');

let cd = new Set();

const replies = [
    "*කවුද හුත්තෝ බඩුව කියලා?* 🤨",
    "*බඩුව? ඔයා ද?* 😂",
    "*මෙහෙ බඩුවක් නෑ... ඉන්නේ ඔයා විතරයි* 😏"
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
    react: "😏",
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

    // WORKING BUTTON FORMAT
    const msg = {
        image: { url: 'https://i.imgur.com/8Km9tLL.jpg' },
        caption: text,
        footer: "👇 පහලින් තෝරගන්න",
        templateButtons: [
            { index: 1, quickReplyButton: { displayText: 'තව 😏', id: '.baduwa' } },
            { index: 2, quickReplyButton: { displayText: 'Vcard 📇', id: 'send_baduwa_vcard' } },
            { index: 3, quickReplyButton: { displayText: 'Direct', id: '.baduvacard' } }
        ],
        mentions: mentionedJid
    };

    await Promise.all([
        robin.sendMessage(from, { react: { text: "😏", key: mek.key } }),
        robin.sendMessage(from, msg, { quoted: mek })
    ]);
});

// BUTTON CLICK HANDLER
cmd({ on: "buttonsResponse" }, async (robin, mek) => {
    const id = mek.message?.buttonsResponseMessage?.selectedButtonId;
    const from = mek.key.remoteJid;

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
