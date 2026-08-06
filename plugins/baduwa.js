const { cmd } = require('../command');

const baduwaReplies = [
    "*කවුද හුත්තෝ බඩුව කියලා?* 🤨",
    "*අයියෝ බඩුවක් කිව්වේ කාටද බන්?* 😂",
    "*මෙහෙ බඩුවක් නෑ නේ... ඔයා විතරයි ඉන්නේ* 😏"
];

// COMMAND
const { cmd } = require('../command');

cmd({
    pattern: "baduwa",
    alias: ["badu"],
    desc: "Fun with buttons",
    category: "fun",
    react: "😏",
    filename: __filename
}, 
async (robin, mek) => {
    try {
        const from = mek.key.remoteJid;
        
        // React
        await robin.sendMessage(from, { react: { text: "😏", key: mek.key } });
        
        const randomReplies = [
            "*කවුද හුත්තෝ බඩුව කියලා?* 🤨",
            "*අයියෝ බඩුවක් කිව්වේ කාටද බන්?* 😂",
            "*මෙහෙ බඩුවක් නෑ නේ... ඔයා විතරයි ඉන්නේ* 😏"
        ];
        const random = randomReplies[Math.floor(Math.random() * randomReplies.length)];

        // Button Message
        const buttonMessage = {
            text: random,
            footer: "👇 තව ආතල් ඕන නම්",
            buttons: [
                { buttonId: '.baduwa', buttonText: { displayText: 'තව එකක් 😏' }, type: 1 },
                { buttonId: '.menu', buttonText: { displayText: 'Menu 📜' }, type: 1 },
                { buttonId: '.ping', buttonText: { displayText: 'Ping 🚀' }, type: 1 }
            ],
            headerType: 1
        };

        await robin.sendMessage(from, buttonMessage, { quoted: mek });

    } catch (e) {
        console.log(e)
    }
});

// AUTO DETECT
cmd({
    on: "body" // සමහර bot වල on: "text" වෙනුවට on: "body"
}, 
async (robin, mek) => {
    try {
        const from = mek.key.remoteJid;
        const body = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
        
        if(!body) return;
        const text = body.toLowerCase();

        if (text.includes("බඩුව")) {
            await robin.sendMessage(from, { react: { text: "😏", key: mek.key } });
            const random = baduwaReplies[Math.floor(Math.random() * baduwaReplies.length)];
            await robin.sendMessage(from, { text: random }, { quoted: mek });
        }
    } catch (e) {
        console.log(e)
    }
});



// Ponnaya ///////




const ponnayaReplies = [
    "*කවුද හුත්තෝ පොන්නයා කියලා?* 🤨"
];

// COMMAND
cmd({
    pattern: "ponnaya",
    alias: ["ponna"],
    react: "🫵",
    category: "fun",
    filename: __filename
}, 
async (robin, mek) => {
    try {
        const from = mek.key.remoteJid;
        await robin.sendMessage(from, { react: { text: "🫵", key: mek.key } });
        
        const random = ponnayaReplies[Math.floor(Math.random() * ponnayaReplies.length)];
        await robin.sendMessage(from, { text: random }, { quoted: mek });
        
    } catch (e) {
        console.log(e)
    }
});

// AUTO DETECT
cmd({
    on: "body" // සමහර bot වල on: "text" වෙනුවට on: "body"
}, 
async (robin, mek) => {
    try {
        const from = mek.key.remoteJid;
        const body = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";
        
        if(!body) return;
        const text = body.toLowerCase();

        if (text.includes("බඩුව")) {
            await robin.sendMessage(from, { react: { text: "😏", key: mek.key } });
            const random = ponnayaReplies[Math.floor(Math.random() * ponnayaReplies.length)];
            await robin.sendMessage(from, { text: random }, { quoted: mek });
        }
    } catch (e) {
        console.log(e)
    }
});
