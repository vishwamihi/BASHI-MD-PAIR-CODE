const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {

IMG: process.env.IMG=`https://telegra.ph/file/d8279f4ca5da23bda7da4.jpg`,
CAPTION: process.env.CAPTION=`*𝐁𝐇𝐀𝐒𝐇𝐈-𝐌𝐃 𝐒𝐄𝐒𝐒𝐈𝐎𝐍-𝐈𝐃*\n\n_🪄 ᴅᴏɴ'ᴛ ꜱʜᴀʀᴇ ʏᴏᴜʀ ꜱᴇꜱꜱɪᴏɴ ɪᴅ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ_`,
//----------------------------------------------------------------------------------------
// Mevvata Mega Acc ekak hadala eke emaill pass dnn one
EMAIL: process.env.EMAIL=`musicwow163@gmail.com`,
PASS: process.env.PASS=`v22@v22@v22`,
    
};
