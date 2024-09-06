// රහසිගතයි 🌝🚨 

const express = require('express');
const config = require('./config');
const fs = require('fs');
const { exec } = require("child_process");
let router = express.Router()
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

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    let pairingCode = null;
    let pairingCodeExpiration = null;

    async function PrabathPair() {
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        try {
            let PrabathPairWeb = makeWASocket({
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
                pairingCode = await PrabathPairWeb.requestPairingCode(num);
                pairingCodeExpiration = Date.now() + 180000; // 3 minutes from now

                if (!res.headersSent) {
                    await res.send({ 
                        code: pairingCode, 
                        expires: pairingCodeExpiration 
                    });
                }

                // Set a timeout to clear the pairing code after 3 minutes
                setTimeout(async () => {
                    if (PrabathPairWeb.authState.creds.registered) {
                        console.log("Device paired successfully before timeout");
                        return;
                    }
                    console.log("Pairing code expired");
                    pairingCode = null;
                    pairingCodeExpiration = null;
                    await removeFile('./session');
                    PrabathPairWeb.end();
                    // Send a response to notify the client about expiration
                    if (!res.headersSent) {
                        res.send({ expired: true });
                    }
                }, 180000);
            }

            PrabathPairWeb.ev.on('creds.update', saveCreds);
            PrabathPairWeb.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === "open") {
                    try {
                        await delay(10000);
                        const sessionPrabath = fs.readFileSync('./session/creds.json');
                        const auth_path = './session/';
                        const user_jid = jidNormalizedUser(PrabathPairWeb.user.id);
                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${user_jid}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const sid = string_session;
                        // Send the image with caption first
                        const imageUrl = config.IMG;
                        const caption = config.CAPTION;
                        await PrabathPairWeb.sendMessage(user_jid, {
                            image: { url: imageUrl },
                            caption: caption,
                        });
                        const dt = await PrabathPairWeb.sendMessage(user_jid, {
                            text: sid
                        });
                        // Notify the client about successful pairing
                        if (!res.headersSent) {
                            res.send({ paired: true, sid: sid });
                        }
                    } catch (e) {
                        console.error("Error in connection.update handler:", e);
                        exec('pm2 restart prabath');
                    }
                    await delay(100);
                    await removeFile('./session');
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    PrabathPair();
                }
            });
        } catch (err) {
            console.error("Error in PrabathPair function:", err);
            exec('pm2 restart prabath-md');
            console.log("service restarted");
            PrabathPair();
            await removeFile('./session');
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }

    // Check if a valid pairing code exists
    if (pairingCode && Date.now() < pairingCodeExpiration) {
        return res.send({ 
            code: pairingCode, 
            expires: pairingCodeExpiration,
            message: "Existing pairing code is still valid."
        });
    }

    // If no valid pairing code exists, generate a new one
    return await PrabathPair();
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exec('pm2 restart prabath');
});

module.exports = router;
