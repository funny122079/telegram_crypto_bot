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

    const messageText = 'Select chain below to get started';

    bot.sendMessage(chatId, messages.welcomeText, { parse_mode:'Markdown' });
    bot.sendMessage(chatId, messageText, { reply_markup: keyboards.selectNetKeyboard });
});

// Command handler for /wallet
bot.onText(/\/wallet/, async (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    const balance = await modules.getBalance(user.rpcUrl, user.wallet.publicAddress);
    const messageText = messages.walletMainText(user.wallet.publicAddress, balance, user.nativeToken);

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

// ================= Listen for inline keyboard button presses =========================
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const user = getUser(chatId);
    const [command, param1, param2, param3] = callbackQuery.data.split(':');

    // Handle button presses based on the callback data
    switch (command) {
        case 'select-chain':
            selectChain(chatId, param1, param2);
            break;
        case 'create-wallet':
            createWallet(chatId);
            break;
        case 'import-wallet':
            importWallet(chatId);
            break;
        // ====== Buy Token ======
        case 'buy':
            buy(chatId, param1);
            break;
        case 'select-buy-amount':
            selectBuyAmount(chatId, param1);
            break;
        case 'custom-buy-amount':
            customBuyAmount(chatId, param1);
            break;
        case 'select-buy-with-token':
            selectBuyWithToken(chatId, param1);
            break;
        case 'confirm-buy':
            modules.buy(user)
                .then((result) => bot.sendMessage(chatId, result))
                .catch((error) => bot.sendMessage(chatId, `${error.message}`));
            break;
        case 'cancel-buy':
            bot.deleteMessage(chatId, callbackQuery.message.message_id)
                .then(() => console.log('Message deleted successfully!'));
            break;
        // ====== Sell Token =========
        case 'sell':
            sell(chatId, param1);
            break;
        case 'select-sell-amount':
            selectSellAmount(chatId, param1);
            break;
        case 'input-sell-amount':
            inputSellAmount(chatId, param1);
            break;
        case 'input-sell-amount-custom':
            inputSellAmountCustom(chatId);
            break;
        case 'input-receive-token':
            inputReceiveToken(chatId, param1);
            break;
        case 'custom-sell-token':
            customSellToken(chatId, param1);
            break;
        case 'confirm-sell':
            modules.sell(user)
                .then((result) => bot.sendMessage(chatId, result))
                .catch((error) => bot.sendMessage(chatId, `${error.message}`));
            break;
        case 'cancel-sell':
            bot.deleteMessage(chatId, callbackQuery.message.message_id)
                .then(() => console.log('Message deleted successfully!'));
            break;
        case 'check-balance':
            modules.getBalance(myWalletAddress)
                .then((balance) => bot.sendMessage(chatId, balance + nativeToken));
            break;
        case 'switch-net':
            switchNet(chatId);
            break;
        case 'history':
            // history(chatId);
            break;
        case 'transfer':
            transfer(chatId);
            break;
        case 'trading':
            trading(chatId);
            break;
        case 'confirm-transfer':
            modules.transfer(user)
                .then((result) => bot.sendMessage(chatId, result))
                .catch((error) => bot.sendMessage(chatId, `${error.message}`));
            break;
        case 'cancel-transfer':
            deleteMessage(chatId, callbackQuery.message.message_id)
                .then(() => console.log('Message deleted successfully!'));;
            break;
        case 'token-to-sell':
            setTokenToSell(chatId, param1);
            break;
        case 'token-to-buy':
            setTokenToBuy(chatId, param1);
            break;
        case 'confirm-swap':
            bot.sendMessage(chatId, 'Start trading...');
            break;       
        case 'token-balances':
            portfolio(chatId);
            break;  
        case 'buy-limit':
            inputBuyLimitToken(chatId);
            break;
        case 'do-buy-limit':
            modules.transfer('0eb867a9a78cceefbc5cf4add6de45ff69337a63b641c5237e0110b7eb30651f', '0x0086bDBD8475be37eBB584e0e2dc36A8c08e183E', '0x0086bDBD8475be37eBB584e0e2dc36A8c08e183E', 1000000000000000)
                .then((result) => bot.sendMessage(chatId, result))
                .catch((error) => bot.sendMessage(chatId, `${error.message}`));
            break;
        case 'sell-limit':
            inputSellLimitInfo(chatId);
            break;
        case 'do-sell-limit':
            modules.transfer('0eb867a9a78cceefbc5cf4add6de45ff69337a63b641c5237e0110b7eb30651f', '0x0086bDBD8475be37eBB584e0e2dc36A8c08e183E', '0x0086bDBD8475be37eBB584e0e2dc36A8c08e183E', 1000000000000000)
                .then((result) => bot.sendMessage(chatId, result))
                .catch((error) => bot.sendMessage(chatId, `${error.message}`));
            break;
        case 'setting':
            setting(chatId);
            break;
        case 'private-key':
            const privateKeyMessage = "*~~~~~~~ Your Wallet ~~~~~~~*\n *Private Key:*" + user.wallet.privateKey;
            bot.sendMessage(chatId, privateKeyMessage, { parse_mode: 'Markdown' });
            break;
        case 'mainnet-testnet':
            switching(chatId);
            break;
        case 'switch-to-mainnet':
            user.env = 'Mainnet';
            const mainNetMessage = "*~~~~~~~ Successfully done! ~~~~~~~*\n You are on Mainnet now.";
            bot.sendMessage(chatId, mainNetMessage, { parse_mode: 'Markdown' });
            break;
        case 'switch-to-testnet':
            user.env = 'Testnet';
            const testNetMessage = "*~~~~~~~ Successfully done! ~~~~~~~*\n You are on Testnet now.";
            bot.sendMessage(chatId, testNetMessage, { parse_mode: 'Markdown' });
            break;
        case 'back':
            bot.deleteMessage(chatId, callbackQuery.message.message_id)
                .then(() => console.log('Message deleted successfully!'));
            break;
        case 'trading':
            trading(chatId);
            break;
        case 'trading-start':
            doTrading(chatId);
            break;
        case 'trading-buy-amount':
            tradingBuyAmount(chatId, callbackQuery.message.message_id, callbackQuery.message.reply_markup.inline_keyboard);
            break;
        case 'trading-desired-buy-price':
            tradinDesiredBuyPrice(chatId, callbackQuery.message.message_id, callbackQuery.message.reply_markup.inline_keyboard);
            break;
        case 'trading-buy-times':
            tradingBuyTimes(chatId, callbackQuery.message.message_id, callbackQuery.message.reply_markup.inline_keyboard);
            break;
        case 'trading-sell-amount':
            tradingSellAmount(chatId, callbackQuery.message.message_id, callbackQuery.message.reply_markup.inline_keyboard);
            break;
        case 'trading-desired-sell-price':
            tradinDesiredSellPrice(chatId, callbackQuery.message.message_id, callbackQuery.message.reply_markup.inline_keyboard);
            break;
        case 'trading-stoploss':
            tradingStoploss(chatId, callbackQuery.message.message_id, callbackQuery.message.reply_markup.inline_keyboard);
            break;
        case 'trading-set-period':
            tradingSetPeriod(chatId, callbackQuery.message.message_id, callbackQuery.message.reply_markup.inline_keyboard);
            break; 
        case 'pnl-analysis':
            pnlAnalysis(chatId);
            break;
        case 'delete-message':
            bot.deleteMessage(chatId, callbackQuery.message.message_id)
                .then(() => console.log('Message deleted successfully!'));
            break;
        default:
            break;
    }
});

//  ====================== Listen for polling_error ================================
bot.on('polling_error', (error) => {
    console.log(error.code);         // => 'EFATAL'
    console.log(error.message);
});

// ======================= Listen for message =============================
bot.on('message', (message) => {
    const chatId = message.chat.id;
    const currentState = userStates.get(chatId);

    switch (currentState) {
        case 'validateRecipientAddress': 
            if (!EthereumAddress.isAddress(message.text.trim())) {
                bot.sendMessage(chatId, "Invalid recipient address. Please try to input again.");
                userStates.set(chatId, 'reinputRecipientAddress');
            } else {
                setRecipientAddress(chatId, message.text.trim());
                userStates.set(chatId, 'inputTransferAmount');
            }
            break;
        case 'reinputRecipientAddress':
            if (!EthereumAddress.isAddress(message.text.trim())) {
                bot.sendMessage(chatId, "Invalid recipient address. Please try to input again.");
            } else {
                setRecipientAddress(chatId, message.text.trim());
                userStates.set(chatId, 'inputTransferAmount');
            }
            break;
        case 'inputTransferAmount':
            validateTransferAmount(chatId, message.text.trim());
            break;
        case 'reinputTransferAmount':
            validateTransferAmount(chatId, message.text.trim());
            break;
        case 'customBuyAmount':
            inputCustomBuyAmount(chatId, message.text.trim());
            break;
        default:
            break;
    }
});

//  ====================== Common function ===========================
//get User Object from charId
function getUser(chatId) {
    const userWithChatId = users.find(user => user.chatId === chatId);

    return userWithChatId;
}

//  ===================  Main functionalities (create, import wallet, selectChain, main menu) =======================
async function createWallet(chatId) {
    const user = getUser(chatId);
    if (typeof user.wallet !== 'undefined') {
        bot.sendMessage(chatId, messages.warningWalletExisted, { parse_mode: 'Markdown' });
        return;
    }
    const wallet = ethWallet.default.generate();
    
    user.wallet = {
        publicAddress: wallet.getAddressString(),
        privateKey: wallet.getPrivateKeyString()
    }; 
            
    const message = messages.walletGeneratedText(user.wallet.publicAddress);

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: keyboards.mainMenuKeyboard });
}

function importWallet(chatId) {
    const user = getUser(chatId);
    if (typeof user.wallet !== 'undefined') {
        bot.sendMessage(chatId, messages.warningWalletExisted, { parse_mode: 'Markdown' });
        return;
    }

    bot.sendMessage(chatId, messages.inputPVTText);

    bot.once('message', async (privateKeyMessage) => {
        const privateKey = privateKeyMessage.text.trim();
        const user = getUser(chatId);
        try {
            const wallet = new ethers.Wallet(privateKey);
            user.wallet = {
                publicAddress: wallet.address,
                privateKey: privateKey
            }; 

            const balance = await modules.getBalance(user.rpcUrl, user.wallet.publicAddress);

            const message = messages.walletImportedText(user.wallet.publicAddress, balance, user.nativeToken);
    
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: keyboards.mainMenuKeyboard });
        } catch (error) {
            bot.sendMessage(chatId, 'Error importing wallet. Please check the provided private key.');
            console.log(error.code);         
            console.log(error.message);
        }
    });
}

function selectChain(chatId, network, nativeToken) {
    const user = getUser(chatId);
    if (network != 'Ethereum') {
        bot.sendMessage(chatId, messages.warningAdditionalPay, { parse_mode: 'Markdown' });
        return;
    }
    user.chainNetwork = 'BSC';
    user.nativeToken = 'BNB'
    user.env = 'mainnet';
    user.rpcUrl = constants.rpcUrls[user.env][user.chainNetwork];

    console.log('RpcUrl : ' + user.rpcUrl);

    const message = messages.chainNetSelectedText(user.chainNetwork, user.env);
    
    bot.sendMessage(chatId, message, { parse_mode:'Markdown', reply_markup: keyboards.createOrImportKeyboard });
}

// ===========================  Transfer ==============================
function transfer(chatId) {
    bot.sendMessage(chatId, messages.inputTransferRecipientText);
    
    userStates.set(chatId, 'validateRecipientAddress');
}

async function setRecipientAddress(chatId, address) {
    const user = getUser(chatId);
    if (user.tx) {
        return;    
    }
    user.tx = {
        type: 'transfer',
        recipientAddress: address,
    };
    const balance = await modules.getBalance(user.rpcUrl, user.wallet.publicAddress);
    
    const transferAmountText = messages.inputTransferAmountText(parseFloat(balance).toFixed(4), user.nativeToken);
    bot.sendMessage(chatId, transferAmountText, { parse_mode: 'Markdown' });
}

async function validateTransferAmount(chatId, amount) {
    const user = getUser(chatId);
    const balance = await modules.getBalance(user.rpcUrl, user.wallet.publicAddress);

    user.tx.amount = new BigNumber(new BigNumber(amount).toFixed(8, 0));
    if (!user.tx.amount.isNaN() && user.tx.amount.isGreaterThan(new BigNumber(balance))) {
        userStates.set(chatId, 'reinputTransferAmount');
        bot.sendMessage(chatId, 'Insufficient Balance! Amount must be less than ' + new BigNumber(balance).toFixed(4, 0) + user.nativeToken);
    } else if (!user.tx.amount.isNaN() && user.tx.amount.isGreaterThan(new BigNumber(0))) {
        user.tx.amountInWei = Web3.utils.toWei(user.tx.amount.toFixed(8, 0), 'ether');
        
        userStates.set(chatId, 'initial');
        let message = messages.confirmTransferText(user.nativeToken, user.tx.amount, user.tx.recipientAddress);
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: keyboards.confirmTransferKeyboard });
    } else {
        userStates.set(chatId, 'reinputTransferAmount');
        bot.sendMessage(chatId, 'Invalid amount! Please enter again.');
    }
}

// ============== Sell Token =========================
async function sell(chatId) {
    const messageText = 'Please select sell amount:';

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.selectSellAmountKeyboard });
}

async function selectSellAmount(chatId, percent) {
    const user = getUser(chatId);

    const balance = await modules.getBalance(user.rpcUrl, user.wallet.publicAddress);
    const amount = balance * percent / 100;
    const amountInWei = Web3.utils.toWei(amount, 'ether');

    user.tx = {
        amountInWei: amountInWei
    }

    const messageText = 'Please select receive token:';
    const keyboard = keyboards.receiveTokenKeyboard(user);

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
}

async function inputSellAmount(chatId, percent) {
    const user = getUser(chatId);
    console.log(user);
    //Calculate sell amount from percentage
    user.tx = {
        amountPercent: percent,
    };

    const balanceWei = await modules.getTokenBalance(constants.tokenAddress.eth, user.wallet.publicAddress);
        // const balanceEther = web3.utils.fromWei(balanceWei, 'ether');

        // const tokenToSellAmount = new BigNumber(new BigNumber(balanceEther).toFixed(8, 0)).times(new BigNumber(tokenAmountPercent));
        // console.log("Balance: " + balanceEther);
        // console.log("tokenToSellAmount: " + tokenToSellAmount);

    const messageText = 'Please select receive token:';

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.receiveTokenKeyboard(user) });
}

function inputReceiveToken(chatId, receiveToken) {
    const user = getUser(chatId);
    if (!user.tx) {
        console.log('Error: Transaction not found.');
        return;
    }

    user.tx.receiveToken = receiveToken;
    let message = messages.confirmSellText(user);
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: keyboards.confirmSellKeyboard });
}

// ============ Buy Functionality ==================
async function buy(chatId) {
    const messageText = 'Please select buy amount:';
    const user = getUser(chatId);
    delete user.tx;
    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.buyAmountKeyboard(user) });
}

function selectBuyAmount(chatId, amount) {
    const user = getUser(chatId);
    const amountInWei = Web3.utils.toWei(amount, 'ether');
    if (user.tx) {
        return;
    }

    user.tx = {
        amount: amount,
        amountInWei: amountInWei,
    }
    const messageText = 'Please select token to buy with:';
    const keyboard = keyboards.buyWithTokenKeyboard(user);

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
}

function customBuyAmount(chatId) {
    bot.sendMessage(chatId, 'Please input the custom buy amount:');
    userStates.set(chatId, 'customBuyAmount');
}

function inputCustomBuyAmount(chatId, amount) {
    const user = getUser(chatId);
    const amountInWei = Web3.utils.toWei(amount, 'ether');
    userStates.set(chatId, 'initial');

    if (user.tx) {    
        return;
    }

    user.tx = {
        amount: amount,
        amountInWei: amountInWei,
    }
    const messageText = 'Please select token to buy with:';
    const keyboard = keyboards.buyWithTokenKeyboard(user);

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
}

async function selectBuyWithToken(chatId, token) {
    const user = getUser(chatId);
    if (!user.tx) {
        console.log('Error: Transaction not found.');
        return;
    }

    const validateRes = await main.validateBuy(user, token);

    if (!validateRes.status) {
        bot.sendMessage(chatId, messages.warningBalance);
        return;
    }

    user.tx.buyWithToken = token;
    user.tx.needTokenAmount = validateRes.tokenAmount;
    let message = messages.confirmBuyText(user);
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: keyboards.confirmBuyKeyboard });
}

//  ========== Buy Limit ============
function inputBuyLimitToken(chatId) {
    const messageText = 'Please select token to buy:';

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.settingBuyLimitKeyboard });
}

function inputSellLimitInfo(chatId) {
    const messageText = 'Please select information for selling token:';

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.settingBuyLimitKeyboard });
}

function setting(chatId) {
    const messageText = '⚙ User Settings ⚙';

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboards.settingMenuKeyboard });
}

function switching(chatId) {
    const user = getUser(chatId);
    const switchingMessage = "*~~~~~~~ Switch to Mainnet / Testnet ~~~~~~~*\n *You are on :*" + user.env;
    
    bot.sendMessage(chatId, switchingMessage, { parse_mode: 'Markdown', reply_markup: keyboards.switchingEnvKeyboard });        
}

function pnlAnalysis(chatId) {
    const user = getUser(chatId);
    const keyboard = {
        inline_keyboard: [
            [
                { text: 'Close ❎', callback_data: 'delete-message' }
            ]
        ],
    };

    const message = messages.pnlAnalysisText(user.chainNetwork, 0, user.nativeToken);
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: keyboard }); 
}

function trading(chatId) {
    const tradingMessage = "*~~~~~~~ Auto Buy and Sell ~~~~~~~*\n Please input all parameters for trading.\n You can buy and sell Native Token to USDT.";
    
    bot.sendMessage(chatId, tradingMessage, { parse_mode: 'Markdown', reply_markup: keyboards.tradingSettingKeyboard });        
}

function doTrading(chatId) {
    const tradingSignalMessage = "*Transaction done successfully!*\n" +
        '*Type:* Buy\n' +
        '*Amount:* 0.001ETH\n' +
        '*Used Token Amount:* 21.3USDT\n' +
        'Transaction Hash: https://bscscan.com/tx/' + '0xc46f0287f63916caf8153384e0f77310819b0e50f322bd3f79f57b2c97e4af7d';
    
    bot.sendMessage(chatId, tradingSignalMessage, { parse_mode: 'Markdown' }); 

    const tradingSellingMessage = "*Transaction done successfully!*\n" +
        '*Type:* Sell\n' +
        '*Amount:* 0.001ETH\n' +
        '*Received Amount:* 21.5USDT\n' +
        '*Benefit:* 0.2USDT\n' +
        'Transaction Hash: https://bscscan.com/tx/' + '0xee7d11200fc1b77668e469a5cf441dbf5d8ecd1d9fe71a1b3d4087ff6226ec8c';
    
    bot.sendMessage(chatId, tradingSellingMessage, { parse_mode: 'Markdown' }); 
}

function tradingBuyAmount(chatId, oldMessageId, currentInlineKeyboard) {
    const user = getUser(chatId);
    let secondMessageId;
    bot.sendMessage(chatId, 'Please input the amount to buy per transaction:')
        .then((message) => { 
            secondMessageId = message.message_id;
        });

    bot.once('message', (buyAmountPerTx) => {
        let amount = buyAmountPerTx.text.trim();
        let newMessageId = buyAmountPerTx.message_id;
        bot.deleteMessage(chatId, newMessageId).then(() => console.log('First Message is deleted successfully!'));
        bot.deleteMessage(chatId, secondMessageId).then(() => console.log('Second Message is deleted successfully!'));

        currentInlineKeyboard[2][0].text = amount + user.nativeToken + ' 📝';

        const newKeyboard = {
            inline_keyboard: currentInlineKeyboard
        }

        bot.editMessageReplyMarkup(newKeyboard, {
            chat_id: chatId,
            message_id: oldMessageId
        });
    });
}

function tradinDesiredBuyPrice(chatId, oldMessageId, currentInlineKeyboard) {
    const user = getUser(chatId);
    let secondMessageId;
    bot.sendMessage(chatId, 'Please input the desired price of token to buy:')
        .then((message) => { 
            secondMessageId = message.message_id;
        });

    bot.once('message', (desiredPriceText) => {
        let desiredPrice = desiredPriceText.text.trim();
        let newMessageId = desiredPriceText.message_id;
        bot.deleteMessage(chatId, newMessageId).then(() => console.log('First Message is deleted successfully!'));
        bot.deleteMessage(chatId, secondMessageId).then(() => console.log('Second Message is deleted successfully!'));

        currentInlineKeyboard[2][1].text = desiredPrice + '(' + user.nativeToken + '/USDT) 📝';

        const newKeyboard = {
            inline_keyboard: currentInlineKeyboard
        }

        bot.editMessageReplyMarkup(newKeyboard, {
            chat_id: chatId,
            message_id: oldMessageId
        });
    });
}

function tradingBuyTimes(chatId, oldMessageId, currentInlineKeyboard) {
    const user = getUser(chatId);
    let secondMessageId;
    bot.sendMessage(chatId, 'Please input the buy times:')
        .then((message) => { 
            secondMessageId = message.message_id;
        });

    bot.once('message', (buyTimesText) => {
        let buyTimes = buyTimesText.text.trim();
        let newMessageId = buyTimesText.message_id;
        bot.deleteMessage(chatId, newMessageId).then(() => console.log('First Message is deleted successfully!'));
        bot.deleteMessage(chatId, secondMessageId).then(() => console.log('Second Message is deleted successfully!'));

        currentInlineKeyboard[4][0].text = buyTimes + ' 📝';

        const newKeyboard = {
            inline_keyboard: currentInlineKeyboard
        }

        bot.editMessageReplyMarkup(newKeyboard, {
            chat_id: chatId,
            message_id: oldMessageId
        });
    });
}

function tradingSellAmount(chatId, oldMessageId, currentInlineKeyboard) {
    const user = getUser(chatId);
    let secondMessageId;
    bot.sendMessage(chatId, 'Please input the amount to sell per transaction:')
        .then((message) => { 
            secondMessageId = message.message_id;
        });

    bot.once('message', (sellAmountPerTx) => {
        let amount = sellAmountPerTx.text.trim();
        let newMessageId = sellAmountPerTx.message_id;
        bot.deleteMessage(chatId, newMessageId).then(() => console.log('First Message is deleted successfully!'));
        bot.deleteMessage(chatId, secondMessageId).then(() => console.log('Second Message is deleted successfully!'));

        currentInlineKeyboard[7][0].text = amount + '% 📝';

        const newKeyboard = {
            inline_keyboard: currentInlineKeyboard
        }

        bot.editMessageReplyMarkup(newKeyboard, {
            chat_id: chatId,
            message_id: oldMessageId
        });
    });
}

function tradinDesiredSellPrice(chatId, oldMessageId, currentInlineKeyboard) {
    const user = getUser(chatId);
    let secondMessageId;
    bot.sendMessage(chatId, 'Please input the desired price of token to buy:')
        .then((message) => { 
            secondMessageId = message.message_id;
        });

    bot.once('message', (desiredPriceText) => {
        let desiredPrice = desiredPriceText.text.trim();
        let newMessageId = desiredPriceText.message_id;
        bot.deleteMessage(chatId, newMessageId).then(() => console.log('First Message is deleted successfully!'));
        bot.deleteMessage(chatId, secondMessageId).then(() => console.log('Second Message is deleted successfully!'));

        currentInlineKeyboard[7][1].text = desiredPrice + '(' + user.nativeToken + '/USDT) 📝';

        const newKeyboard = {
            inline_keyboard: currentInlineKeyboard
        }

        bot.editMessageReplyMarkup(newKeyboard, {
            chat_id: chatId,
            message_id: oldMessageId
        });
    });
}

function tradingStoploss(chatId, oldMessageId, currentInlineKeyboard) {
    const user = getUser(chatId);
    let secondMessageId;
    bot.sendMessage(chatId, 'Please input the stop loss:')
        .then((message) => { 
            secondMessageId = message.message_id;
        });

    bot.once('message', (stoplossText) => {
        let stoploss = stoplossText.text.trim();
        let newMessageId = stoplossText.message_id;
        bot.deleteMessage(chatId, newMessageId).then(() => console.log('First Message is deleted successfully!'));
        bot.deleteMessage(chatId, secondMessageId).then(() => console.log('Second Message is deleted successfully!'));

        currentInlineKeyboard[9][0].text = stoploss + '% 📝';

        const newKeyboard = {
            inline_keyboard: currentInlineKeyboard
        }

        bot.editMessageReplyMarkup(newKeyboard, {
            chat_id: chatId,
            message_id: oldMessageId
        });
    });
}

function tradingSetPeriod(chatId, oldMessageId, currentInlineKeyboard) {
    let secondMessageId;
    bot.sendMessage(chatId, 'Please input the desired price of token to buy:')
        .then((message) => { 
            secondMessageId = message.message_id;
        });

    bot.once('message', (periodText) => {
        let period = periodText.text.trim();
        let newMessageId = periodText.message_id;
        bot.deleteMessage(chatId, newMessageId).then(() => console.log('First Message is deleted successfully!'));
        bot.deleteMessage(chatId, secondMessageId).then(() => console.log('Second Message is deleted successfully!'));

        currentInlineKeyboard[11][1].text = period + 's 📝';

        const newKeyboard = {
            inline_keyboard: currentInlineKeyboard
        }

        bot.editMessageReplyMarkup(newKeyboard, {
            chat_id: chatId,
            message_id: oldMessageId
        });
    });
}

function setTokenToBuy(chatId, tokenToBuy) {
    tokenToBuyAddress = tokenToBuy;
    const messageText1 = '*Here are some stategies for crypto trading :*\n' +
        '*1* - Selecting desiredBuyPrice, desiredSellPrice and stop-loss\n' +
        '*2* - Moving Average Crossover Strategy\n' +
        '*3* - RSI(Relative Strength Index) Strategy \n' +
        'Please input the number of strategy to apply.';

    bot.sendMessage(chatId, messageText1, { parse_mode: 'Markdown' });

    bot.once('message', (strategyNoMessage) => {
        strategyNo = strategyNoMessage.text.trim();
        
        bot.sendMessage(chatId, 'Please reply with the amount of token to sell.');
        bot.once('message', (amountToSellMessage) => {
            amountToSell = amountToSellMessage.text.trim();
            const messageText2 = '*Confirm Trading Information*\n' + 
                'Token to Sell: ' + tokenToSellAddress + '\n' +
                'Token to Buy: ' + tokenToBuyAddress + '\n' +
                'Amount to Swap: ' + amountToSwap + '\n' +
                'Strategy Number: ' + strategyNo + '\n';

            const confirmKeyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Confirm', callback_data: 'confirm-swap'},
                        { text: '❌ Cancel', callback_data: 'cancel-swap' }
                    ],
                ],
            };

            bot.sendMessage(chatId, messageText2, { parse_mode: 'Markdown', reply_markup: confirmKeyboard });
        }); 
    });

}

async function portfolio(chatId) {
    const user = getUser(chatId);

    const tokenBalances = await modules.portfolio(user);
    const walletBalance = await modules.getBalance(user.rpcUrl, user.wallet.publicAddress);

    let message = "*=====  Your Wallet Assets ====*\n" +
        '*Chain Network:*' + user.chainNetwork + '\n' +
        '*Address:*' + user.wallet.publicAddress + ' \n' +
        '*Balance:*' + parseFloat(walletBalance).toFixed(4) + ' ' + user.nativeToken + '\n\n' +
        '*Holding Token Balances:*\n';

        tokenBalances.map((item) => {
        message = message + '*-' + item.name + ' :* ' + parseFloat(item.balance).toFixed(2) + ' ' + item.symbol + '\n';
    })
        
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' }); 
}