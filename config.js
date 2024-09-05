const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {

IMG: process.env.IMG=`https://telegra.ph/file/d8279f4ca5da23bda7da4.jpg`,
CAPTION: process.env.CAPTION=`*𝐁𝐇𝐀𝐒𝐇𝐈-𝐌𝐃 𝐒𝐄𝐒𝐒𝐈𝐎𝐍-𝐈𝐃*\n\n_🪄 ᴅᴏɴ'ᴛ ꜱʜᴀʀᴇ ʏᴏᴜʀ ꜱᴇꜱꜱɪᴏɴ ɪᴅ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ_`,
//----------------------------------------------------------------------------------------
// මෙතනය ඔයා mega එකෙ Account එකක් හදලා එකෙ Email පාස් දාන්න ඔනේ මෙක වැඩ කරන්නෙනැතුව ගියොත් අවුල එන්නෙ ඔකෙ.
EMAIL: process.env.EMAIL=`Kaushalya4d@gmail.com`,
PASS: process.env.PASS=`Kaushalya4d@gmail.com`,
    
};
