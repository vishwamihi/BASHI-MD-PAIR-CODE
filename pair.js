const express = require('express');
const config = require('./config');
const fs = require('fs');
const { exec } = require("child_process");
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

let router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

const codes = {}; // In-memory store for pairing codes

async function generatePairingCode(num) {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    let PrabathPairWeb;

    try {
        PrabathPairWeb = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }).child({ level: "fatal" }),
            browser: Browsers.macOS("Safari"),
        });

        if (!PrabathPairWeb.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const pairingCode = await PrabathPairWeb.requestPairingCode(num);
            const pairingCodeExpiration = Date.now() + 180000; // 3 minutes from now

            // Store the pairing code and its expiration
            codes[num] = { code: pairingCode, expires: pairingCodeExpiration };

            // Respond with the new pairing code
            return { code: pairingCode, expires: pairingCodeExpiration };
        }

        PrabathPairWeb.ev.on('creds.update', saveCreds);
        PrabathPairWeb.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s;
            if (connection === "open") {
                try {
                    await delay(10000);
                    const sessionPrabath = fs.readFileSync('./session/creds.json');
                    const user_jid = jidNormalizedUser(PrabathPairWeb.user.id);
                    const mega_url = await upload(fs.createReadStream('./session/creds.json'), `${user_jid}.json`);
                    const string_session = mega_url.replace('https://mega.nz/file/', '');
                    const sid = string_session;

                    const imageUrl = config.IMG;
                    const caption = config.CAPTION;
                    await PrabathPairWeb.sendMessage(user_jid, {
                        image: { url: imageUrl },
                        caption: caption,
                    });
                    await PrabathPairWeb.sendMessage(user_jid, {
                        text: sid
                    });

                    await removeFile('./session');
                    process.exit(0);
                } catch (e) {
                    console.error("Error in connection.update handler:", e);
                    exec('pm2 restart prabath');
                }
                await delay(100);
                await removeFile('./session');
                process.exit(0);
            } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                console.log("Connection closed, retrying...");
                await delay(10000);
                generatePairingCode(num);
            }
        });
    } catch (err) {
        console.error("Error in generatePairingCode function:", err);
        exec('pm2 restart prabath');
        await removeFile('./session');
        return { code: "Service Unavailable" };
    }
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    // Check if the pairing code already exists for the given number
    if (codes[num] && Date.now() < codes[num].expires) {
        return res.send({
            code: codes[num].code,
            expires: codes[num].expires,
            message: "Existing pairing code is still valid."
        });
    }

    // Generate a new pairing code if none exists or if the existing one has expired
    const result = await generatePairingCode(num);
    if (result.code) {
        res.send(result);
    } else {
        res.send({ code: "Service Unavailable" });
    }
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exec('pm2 restart prabath');
});

module.exports = router;
