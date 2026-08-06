const { cmd } = require('../command');

cmd({
    pattern: "baduwa",
    alias: ["badu"],
    react: "😏",
    category: "fun",
    filename: __filename
},
async (robin, mek) => {
    const from = mek.key.remoteJid;
    await robin.sendMessage(from, { react: { text: "😏", key: mek.key } });

    const replies = ["*කවුද හුත්තෝ බඩුව කියලා?* 🤨", "*බඩුව? ඔයා ද?* 😂"];
    const random = replies[Math.floor(Math.random() * replies.length)];

    // FAKE VCARD DATA
    const fakeContact = {
        displayName: "Baduwa King 👑", // පෙන්නන නම
        vcard: `BEGIN:VCARD
VERSION:3.0
FN:Baduwa King 👑
ORG:Baduwa Company;
TEL;type=CELL;type=VOICE;waid=94771234567:+94 77 123 4567
EMAIL:baduwa.king@fake.com
END:VCARD`
    };

    // BUTTONS + CONTACT
    const buttonMessage = {
        text: random,
        footer: "👇 Contact එකත් බලන්න",
        buttons: [
            { buttonId: '.baduwa', buttonText: { displayText: 'තව එකක් 😏' }, type: 1 },
            { buttonId: 'send_vcard', buttonText: { displayText: 'Fake Contact 📇' }, type: 1 }
        ],
        headerType: 1,
        contextInfo: {
            mentionedJid: [],
            forwardingScore: 999,
            isForwarded: true,
        }
    };

    // පලවෙනි msg එක
    await robin.sendMessage(from, buttonMessage, { quoted: mek });

    // Button click කරාම vcard යවන්න
    // මේකට වෙනම event listener එකක් ඕන. නැත්තම් simple version එකක් දෙන්නම්
});

// SIMPLE VERSION: .baduva vcard කියලා ගැහුවම direct vcard යනවා
cmd({
    pattern: "badunb",
    react: "📇",
    desc: "Send fake vcard",
    category: "fun",
    filename: __filename
},
async (robin, mek) => {
    const from = mek.key.remoteJid;
    
    const fakeContact = {
        key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: from },
        message: { 
            contactMessage: {
                displayName: "දාර බඩුව 🥷",
                vcard: `BEGIN:VCARD
VERSION:3.0
FN:Baduwa King 👑
ORG:Baduwa Company;
TEL;type=CELL;type=VOICE;waid=94765480861
EMAIL:baduwaking.com
END:VCARD`,
                jpegThumbnail: null
            }
        }
    };

    await robin.sendMessage(from, { 
        contacts: { 
            displayName: "Baduwa King 👑", 
            contacts: [fakeContact.message.contactMessage] 
        } 
    }, { quoted: mek });
});
