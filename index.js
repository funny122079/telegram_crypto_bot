require('dotenv').config()
const {TOKEN} = process.env
const BigNumber = require("bignumber.js");
const telegramBot = require('node-telegram-bot-api')
const bot = new telegramBot(TOKEN, {polling:true})
const ethWallet = require('ethereumjs-wallet')
const {ethers} = require('ethers');
const {Web3} = require('web3');
const EthereumAddress = require('ethereum-address');
const constants = require('./constants');
const modules = require('./modules');
const validate = require('./validate');
const keyboards = require('./consts/keyboards');
const messages = require('./consts/messageTexts');
const axios = require('axios');

// define some variables
const userStates = new Map();

const users = [
    {
        chatId: '1',
        env: 'mainnet',
        chainNetwork: 'Ethereum',
        nativeToken: 'ETH',
        wallet: {
            publicAddress: '0x00',
            privateKey: '0f00'
        },
        tx: [
            {
                id: 1,
                type: 'transfer',
                recipient: '0f00',
                amount: '0.003',
                date: '01/12/2024',
                status: 'success'
            },
            {
                id: 1,
                type: 'buy',
                recipient: '0f00',
                amount: '0.003',
                date: '01/12/2024',
                status: 'pending'
            }
        ]
    }
];

// ============= Command Handler =====================
bot.onText(/\/start/, async(msg) => {
    const chatId = msg.chat.id;
    users.push({
        chatId: chatId,
        env: 'testnet'
    });

    start(chatId);
});

// =============== Command handlers ==================
bot.onText(/\/wallet/, async (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    if (!user) {
        bot.sendMessage(chatId, 'User account does not exist on this platform. Please start bot using /start command.');
        return;
    }

    const balance = await modules.getBalance(user.rpcUrl, user.wallet.publicAddress);
    const messageText = messages.walletMainText();

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.mainMenuKeyboard });
});

bot.onText(/\/trading/,(message) => {
    const chatId = message.from.id;
    trading(chatId);
});

bot.onText(/\/history/,(message) => {
    const chatId = message.from.id;
    // history(chatId);
});

bot.onText(/\/buy/,(message) => {
    const chatId = message.from.id;
    buy(chatId);
});


//  ====================== Listen for polling_error ================================
bot.on('polling_error', (error) => {
    console.log(error.code);         // => 'EFATAL'
    console.log(error.message);
});

// ====================== Listen for inline keyboard button presses =========================
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const oldMessageId = callbackQuery.message.message_id;

    const user = getUser(chatId);
    const [command, param1, param2, param3] = callbackQuery.data.split(':');

    // Handle button presses based on the callback data
    switch (command) {
        case 'delete-message': 
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
            break;
        case 'select-chain':
            selectChain(chatId, oldMessageId, param1, param2);
            break;
        case 'wallet-manage':
            walletManage(chatId, oldMessageId);
            break;
        case 'wallet-detail':
            walletDetail(chatId, oldMessageId, param1);
            break;
        case 'import-wallet':
            importWallet(chatId, oldMessageId, param1);
            break;
        case 'regenerate-wallet':
            regenerateWallet(chatId, oldMessageId, param1);
            break;
        case 'private-key':
            showPrivateKey(chatId, oldMessageId, param1);
            break;
        default:
            break;
    }
});

// ======================= Listen for message =============================
bot.on('message', (message) => {
    const chatId = message.chat.id;
    const currentState = userStates.get(chatId);

    switch (currentState) {
        
        default:
            break;
    }
});

//  ====================== Common functions ===========================
//get User Object from charId
function getUser(chatId) {
    const userWithChatId = users.find(user => user.chatId === chatId);

    return userWithChatId;
}

function getWallet(user, walletId) {
    const wallet = user.wallet.find(wallet => wallet.walletId == walletId);

    console.log("Selected Wallet: ", wallet);
    return wallet;
}

//  ===================  Main functionalities (create, import wallet, selectChain, main menu) =======================
async function start(chatId) {
    const messageText = 'Select chain below to get started';

    bot.sendMessage(chatId, messages.welcomeText, { parse_mode:'Markdown' });
    bot.sendMessage(chatId, messageText, { reply_markup: keyboards.selectNetKeyboard });
}

async function createWallet(user, i) {
    const wallet = ethWallet.default.generate();
    const balance = await modules.getBalance(user.rpcUrl, wallet.getAddressString());
    
    user.wallet.push({
        walletId: i + 1,
        publicAddress: wallet.getAddressString(),
        privateKey: wallet.getPrivateKeyString(),
        balance: balance + user.nativeToken
    }); 

    return user;
}

async function selectChain(chatId, oldMessageId, network, nativeToken) {
    const user = getUser(chatId);
    if (network != 'Ethereum') {
        bot.sendMessage(chatId, messages.warningAdditionalPay, { parse_mode: 'Markdown' });
        return;
    }
    user.chainNetwork = network;
    user.nativeToken = nativeToken;
    user.env = 'mainnet';
    user.rpcUrl = constants.rpcUrls[user.env][user.chainNetwork];

    console.log('RpcUrl : ' + user.rpcUrl);
    
    user.wallet = [];
    for (let i= 0; i < 3; i++ ) {
        await createWallet(user, i);
    }

    const messageText1 = messages.chainNetSelectedText(user.chainNetwork, user.env);
    const messageText2 = messages.walletMainText();

    bot.deleteMessage(chatId, oldMessageId);
    bot.sendMessage(chatId, messageText1, { parse_mode: 'Markdown' });
    bot.sendMessage(chatId, messageText2, { parse_mode:'HTML', reply_markup: keyboards.mainMenuKeyboard });
}

// ===================== Wallet Management ===============================
function walletManage(chatId, oldMessageId) {
    const user = getUser(chatId);
    const messageText = messages.walletManageMainText(user);

    bot.deleteMessage(chatId, oldMessageId);
    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.walletManageMainKeyboard });
}

function walletDetail(chatId, oldMessageId, walletId) {
    const user = getUser(chatId);
    const wallet = getWallet(user, walletId);

    const messageText = messages.walletDeatilText(wallet);
    
    bot.deleteMessage(chatId, oldMessageId);
    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.walletDetailMenuKeyboard(walletId) });
}

function importWallet(chatId, oldMessageId, walletId) {
    const user = getUser(chatId);
    console.log(user.wallet[walletId - 1]);
    const messageText1 = 'Please input a private key to replace this wallet with.';
    
    bot.sendMessage(chatId, messageText1);

    bot.once('message', async (message) => {
        const newChatId = message.chat.id;
        const newMessageId = message.message_id;
        const privateKey = message.text.trim();
        
        if (chatId != newChatId) {
            console.log("Chat Error");
            return;
        }

        try {
            const wallet = new ethers.Wallet(privateKey);
            user.wallet[walletId - 1].publicAddress = wallet.address;
            user.wallet[walletId - 1].privateKey = privateKey;
            user.wallet[walletId - 1].balance = await modules.getBalance(user.rpcUrl, wallet.address) + user.nativeToken;

            const messageText = messages.walletDeatilText(user.wallet[walletId - 1]);

            bot.deleteMessage(newChatId, oldMessageId);
            bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.walletDetailMenuKeyboard(walletId) });
        } catch (error) {
            bot.sendMessage(newChatId, 'Error importing wallet. Please check the provided private key.');
            console.log(error.code);         
            console.log(error.message);
        }
    });
}

async function regenerateWallet(chatId, oldMessageId, walletId) {
    const user = getUser(chatId);
    try {
        const wallet = ethWallet.default.generate();
        const balance = await modules.getBalance(user.rpcUrl, wallet.getAddressString());
        
        user.wallet[walletId - 1].publicAddress = wallet.getAddressString();
        user.wallet[walletId - 1].privateKey = wallet.getPrivateKeyString();
        user.wallet[walletId - 1].balance = balance + user.nativeToken;

        const messageText = messages.walletDeatilText(user.wallet[walletId - 1]);
        bot.deleteMessage(chatId, oldMessageId);
        bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.walletDetailMenuKeyboard(walletId) });
    } catch (error) {
        console.log(error.code);         
        console.log(error.message);
    }
}

function showPrivateKey(chatId, oldMessageId, walletId) {
    const user = getUser(chatId);
    const wallet = getWallet(user, walletId);
    const messageText = messages.showPrivateKeyText(wallet);

    const privateKeyboard = {
        inline_keyboard: [
            [ { text: '❎ Close', callback_data: 'delete-message' } ],
        ],
    }
    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: privateKeyboard } );
}