const { cmd } = require('../command');

const baduwaReplies = [
    "*කවුද හුත්තෝ බඩුව කියලා?* 🤨",
    "*අයියෝ බඩුවක් කිව්වේ කාටද බන්?* 😂",
    "*මෙහෙ බඩුවක් නෑ නේ... ඔයා විතරයි ඉන්නේ* 😏",
    "*බඩුව? මම නම් නෙමෙයි* 🙄"
];

const aiyaReplies = [
    "*ඔව් අයියේ මොකද?* 😎",
    "*අයියා කියලා කෑ ගහන්න එපා බන්* 🤣",
    "*අයියට මොනාද ඕන?*"
];

const akkaReplies = [
    "*ඔව් අක්කේ කියන්න* 🥰",
    "*අක්කා අද ලස්සනයි* ✨",
    "*අක්කට මොකද තරහ?*"
];

// 1. COMMAND SYSTEM - .baduwa .aiya .akka
cmd({
    pattern: "baduwa",
    alias: ["badu"],
    desc: "Fun reply",
    category: "fun",
    react: "😏",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    await conn.sendMessage(m.from, { react: { text: "😏", key: mek.key } });
    const random = baduwaReplies[Math.floor(Math.random() * baduwaReplies.length)];
    reply(random);
});

cmd({
    pattern: "aiya",
    desc: "Aiya reply",
    category: "fun",
    react: "😎",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    await conn.sendMessage(m.from, { react: { text: "😎", key: mek.key } });
    const random = aiyaReplies[Math.floor(Math.random() * aiyaReplies.length)];
    reply(random);
});

cmd({
    pattern: "akka",
    desc: "Akka reply",
    category: "fun",
    react: "🥰",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    await conn.sendMessage(m.from, { react: { text: "🥰", key: mek.key } });
    const random = akkaReplies[Math.floor(Math.random() * akkaReplies.length)];
    reply(random);
});

// 2. AUTO DETECT SYSTEM - "බඩුව" කියලා දැම්මොත්
cmd({
    on: "text",
    fromMe: false
}, async (conn, mek, m, { body, from, reply }) => {
    if (!body) return;
    
    const text = body.toLowerCase();
    
    // "බඩුව" වචනය තියෙනවද බලනවා
    if (text.includes("බඩුව")) {
        await conn.sendMessage(from, { react: { text: "😏", key: mek.key } });
        const random = baduwaReplies[Math.floor(Math.random() * baduwaReplies.length)];
        await reply(random);
    }
    
    // "අයියේ" කියලා දැම්මොත්
    else if (text.includes("අයියේ") || text.includes("aiya")) {
        await conn.sendMessage(from, { react: { text: "😎", key: mek.key } });
        const random = aiyaReplies[Math.floor(Math.random() * aiyaReplies.length)];
        await reply(random);
    }
    
    // "අක්කේ" කියලා දැම්මොත්
    else if (text.includes("අක්කේ") || text.includes("akka")) {
        await conn.sendMessage(from, { react: { text: "🥰", key: mek.key } });
        const random = akkaReplies[Math.floor(Math.random() * akkaReplies.length)];
        await reply(random);
    }
});
