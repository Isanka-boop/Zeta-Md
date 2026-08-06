const { cmd } = require('../command');

// NOTE: this requires your main server file to `module.exports = { Pair, ... }`.
// If your main file isn't called index.js, change '../index' below to match it.
const { Pair, PAIRING_CODE_TTL_MS } = require('../pair');

cmd({
    pattern: "pair",
    alias: ["connect", "link"],
    desc: "Generate a pairing code to link a new WhatsApp number to the bot",
    category: "owner",
    react: "🔗",
    filename: __filename
}, async (sock, mek, m, { args, reply, isOwner }) => {
    try {
        // Remove the next line if you want ANY user to be able to pair (e.g. in private-mode fallback flows)
        if (!isOwner) return reply("❌ Only the bot owner can use this command.");

        const raw = args[0];
        if (!raw) {
            return reply(
                "📌 *Usage:* .pair <number>\n\n" +
                "Example: .pair 94712345678\n" +
                "(Include the country code, no + or spaces.)"
            );
        }

        const number = raw.replace(/[^0-9]/g, '');
        if (number.length < 8) {
            return reply("❌ Invalid number. Include the country code, e.g. 94712345678");
        }

        await reply("⏳ Generating pairing code, please wait...");

        // Pair() expects a res-like object with .headersSent and .json(); we fake one so
        // we can reuse the exact same pairing logic the HTTP /pair route uses.
        const fakeRes = {
            headersSent: false,
            json(data) {
                if (this.headersSent) return;
                this.headersSent = true;

                if (data.code) {
                    const mins = Math.round((data.expiresInSec || PAIRING_CODE_TTL_MS / 1000) / 60);
                    reply(
                        `✅ *Pairing Code Generated*\n\n` +
                        `📱 Number: ${number}\n` +
                        `🔑 Code: *${data.code}*\n` +
                        `⏱️ Expires in ${mins} minute(s) if unused\n\n` +
                        `Open WhatsApp → Linked Devices → Link with phone number, and enter this code.`
                    );
                } else if (data.status === 'already_paired') {
                    reply(`ℹ️ ${data.message || 'This number is already paired and active.'}`);
                } else if (data.error) {
                    reply(`❌ ${data.error}`);
                }
            }
        };

        await Pair(number, fakeRes);

    } catch (e) {
        console.error('[PAIR PLUGIN ERROR]', e);
        reply('❌ Failed to generate pairing code: ' + e.message);
    }
});
