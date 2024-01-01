const config = require('./config.js');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.telegramBotToken, { polling: true });


const CHAT_IDS_FILE = './chatIDs.json'; // File to store chat IDs

console.log('fork is running');

(async () => {
    try {
        const params = await new Promise((resolve) => {
            process.on('message', (params) => {
                resolve(params);
            });
        });

        if (!params.recipients) {
            throw new Error('No recipients provided.');
        }

        await shareFiles({
            recipients: params.recipients,
            sharedFolder: params.sharedFolder,
        });

        process.exit(0);
    } catch (error) {
        console.error('Error occurred:', error);
        process.send({
            type: 'error',
            error: error.message,
        });
        process.exit(1); // Exit with a non-zero code to indicate an error
    }
})();

async function shareFiles({ 
    recipients, 
    sharedFolder,
}) {
    let errorLabel;
    try {
        errorLabel = 'Error readdir:';
        const files = await fs.promises.readdir(sharedFolder)
        .then((files) => {
            return files;
        });

        for (const file of files) {
            const photoPath = path.join(sharedFolder, file);

            for (const { id, caption } of recipients) {
                errorLabel = 'Error readfile';
                const photo = fs.readFileSync(photoPath);

                errorLabel = 'Error sendPhoto';
                // Assuming bot.sendPhoto returns a promise
                await bot.sendPhoto(id, photo, { caption });                                
            }
        }
    } catch (error) {
        console.error(errorLabel, error);
        throw new Error(error);
    }
}

function getRecipients() {
    // Load chat IDs from chatIDsFile (Replace this with your own logic)
    try {
        const data = fs.readFileSync(CHAT_IDS_FILE, 'utf8');
        const chatIDs = JSON.parse(data);
        return chatIDs;
    } catch (err) {
        console.error('Error reading chat IDs file:', err);
        return [];
    }
}

// Function to save chat ID to disk
function saveChatID({
    chat,
}) {
    fs.readFile(CHAT_IDS_FILE, (err, data) => {
        let chatIDsObject = {};

        if (!err) {
            chatIDsObject = JSON.parse(data);
        }

        const {
            id: chatID,
        } = chat;

        if (!chatIDsObject[chatID]) {
            chatIDsObject[chatID] = chat;
            fs.writeFile(CHAT_IDS_FILE, JSON.stringify(chatIDsObject), (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                } else {
                    console.log('Chat ID saved:', chatID);
                }
            });
        }
    });
}

// Event listener for the /start command
// bot.onText(/\/start/, (msg) => {
//     saveChatID({
//         chat: msg.chat,
//     });

//     bot.sendMessage(msg.chat.chatID, 'Welcome!');
// });

// // Optional: Log errors
// bot.on('polling_error', (error) => {
//     console.error('Polling error:', error);
// });

// bot.on('message', (msg) => {
//     saveChatID({
//         chat: msg.chat,
//     });
// });
