require('dotenv').config()
const {TOKEN} = process.env
const {IS_TEST} = process.env
const BigNumber = require("bignumber.js");
const telegramBot = require('node-telegram-bot-api')
const bot = new telegramBot(TOKEN, {polling:true})
const ethWallet = require('ethereumjs-wallet')
const {ethers} = require('ethers');
const {Web3} = require('web3');
const { ChainId, Token, WETH, Fetcher, Route } = require('@uniswap/sdk');
const constants = require('./constants');
const modules = require('./modules');

// const abi = {
//     token: require('./abi/abi_token.json'),
//     factory:require('./abi/abi_uniswap_v2_factory'),
//     factory1:require('./abi/abi_uniswap_v2').factory,
//     router: require('./abi/abi_uniswap_v2_router_all.json'),
//     pair: require('./abi/abi_uniswap_v2_pair.json'),
// }

// define some variables
const userStates = new Map();

//This is my wallet imported by telegram bot.
const myLocalPrivateKey = '0eb867a9a78cceefbc5cf4add6de45ff69337a63b641c5237e0110b7eb30651f';
const myLocalAddress = '0x0086bDBD8475be37eBB584e0e2dc36A8c08e183E';

//This is Metamask wallet on Chrome browser.
const testMetaMaskPrivateKey = '0eb867a9a78cceefbc5cf4add6de45ff69337a63b641c5237e0110b7eb30651f';
const testMetaMaskAddress = '0x0086bDBD8475be37eBB584e0e2dc36A8c08e183E';

const erc20TokenAbi = [
// ERC-20 standard functions
    'function balanceOf(address) view returns (uint256)',
    'function symbol() view returns (string)',
];

let senderPrivateKey, recipientAddress, amount;
let netType = 'testnet';
let chainPlatform = 'Ethereum';
let nativeToken = 'ETH';
let tokenToSellAddress; // e.g., ETH
let tokenToBuyAddress; // e.g., DAI
let amountToSwap;
let strategyNo;
let myWalletAddress;
let myWalletPrivateKey;
let myWalletBalance;
let amountInWei;
// const store = {
//     '1000': {
//         wallet
//     }
// }
let chat = {
    chatId:'string',
    wallet: {
        publicAddress: 'string',
        privateKey: 'string',
    },
    tx: {
        id: 'integer',
        senderAddress: 'string'
    }
}

const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const desiredBuyPrice = 1000; // Desired buy price in ETH
const desiredSellPrice = 2000; // Desired sell price in ETH
const stopLossPercentage = 4; // 4% stop loss

const rpcUrl = constants.rpcUrl;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

const dashboardMessage = 'What do you want to do with the bot?';

bot.onText(/\/start/, (msg) => {
    // if (!store[msg.chat.id]) {
    //     store[msg.chat.id] = {
    //         id: msg.chat.id
    //     }
    // }
    // const chat = store[msg.chat.id];

    const chatId = msg.chat.id;

    const selectNetKeyboard = {
        inline_keyboard: [
            [{ text: 'Ethereum', callback_data: 'select-chain:Ethereum:ETH'}, { text: 'Polygon', callback_data: 'select-chain:Polygon:MATIC'}, { text: 'Arbitrum', callback_data: 'select-chain:Arbitrum:ARB'}],
        ],
    };

    const messageText1 = '*Welcome to CryptiboBot!*\n' +  
        'We are providing high qualified service to grow your crypto trading business step by step.\n' +
        'Try it today and start automating the fantastic our several good and benefitable strategy with secure bot in our board.\n' +
        'You will spend short time and get big benefit.\n' +
        '*Commands*\n' +
        '#1. Use: /start to start this Bot\n' + 
        '#2. Use: /wallet to show all functions of your wallet\n' +
        '#3. Use: /transfer to send Coin to external wallet\n' +
        '#4. Use: /trading to swap\n';
    const messageText2 = 'Select chain below to get started';

    bot.sendMessage(chatId, messageText1, { parse_mode:'Markdown' });
    bot.sendMessage(chatId, messageText2, { reply_markup: selectNetKeyboard });
});

// Command handler for /wallet
bot.onText(/\/wallet/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, dashboardMessage, { parse_mode: 'Markdown', reply_markup: mainMenuKeyboard });
});

// Command handler for /start
bot.onText(/\/select-type/, (msg) => {
    const chatId = msg.chat.id;

});

bot.onText(/\/transfer/,(message) => {
    const chatId = message.from.id;
    transfer(chatId);
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

// Listen for inline keyboard button presses
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const [command, param1, param2, param3] = callbackQuery.data.split(':');

    // Handle button presses based on the callback data
    switch (command) {
        case 'select-chain':
            selectChain(chatId, param1, param2);
            break;
        case 'select-type':
            selectWalletType(chatId, param1);
            break;
        case 'create-wallet':
            createWallet(chatId);
            break;
        case 'import-wallet':
            importWallet(chatId);
            break;
        case 'buy':
            buy(chatId, param1);
            break;
        case 'input-buy-token':
            inputBuyToken(chatId, param1);
            break;
        case 'custom-buy-token':
            customBuyToken(chatId, param1);
            break;
        case 'confirm-buy':
            modules.buy(myLocalPrivateKey, "0.001")
                .then((result) => bot.sendMessage(chatId, result))
                .catch((error) => bot.sendMessage(chatId, `${error.message}`));
            break;
        case 'cancel-buy':
            bot.deleteMessage(chatId, callbackQuery.message.message_id)
                .then(() => console.log('Message deleted successfully!'));
            break;
        case 'sell':
            sell(chatId, param1);
            break;
        case 'input-sell-token':
            inputSellToken(chatId, param1);
            break;
        case 'input-receive-token':
            inputReceiveToken(chatId, param1, param2);
            break;
        case 'custom-sell-token':
            customSellToken(chatId, param1);
            break;
        case 'confirm-sell':
            modules.sell(myWalletPrivateKey, 0.1)
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
            modules.transfer('0eb867a9a78cceefbc5cf4add6de45ff69337a63b641c5237e0110b7eb30651f', '0x0086bDBD8475be37eBB584e0e2dc36A8c08e183E', myWalletAddress, amountInWei)
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
            modules.getTokenBalances(chatId)
                .then((result) => bot.sendMessage(chatId, result));
            break;   
        default:
            break;
    }
});

// Listen for polling_error
bot.on('polling_error', (error) => {
    console.log(error.code);         // => 'EFATAL'
    console.log(error.message);
});

// Listen for message
bot.on('message', (message) => {
    const chatId = message.chat.id;
    const currentState = userStates.get(chatId);

    switch (currentState) {
        case 'waitingPVT':
            const privateKey = message.text;
            const messageText1 = '*Wallet Generated Successfully!*\n' + 
                '*- Address:*\n 7mETqHNJqxaTxJ1GTKqQBkiZuvG7bNKbe8mqsuAtmFHN\n\n' + 
                '*- PrivateKey:*\n' +  privateKey + '\n\n' + 
                '*- Balance:* 0 ETH\n Save the privatekey to restore unused BNB/ETH after deployment.\n' +
                'What do you want to do with the bot?';
            bot.sendMessage(chatId, messageText1, { parse_mode: 'Markdown', reply_markup: mainMenuKeyboard });
            userStates.set(chatId, 'initial');
            break;
        case 'waitingReceiver':
            receiver = message.text;
            const messageText2 = 'Please reply with amount to send :';
            bot.sendMessage(chatId, messageText2);
            userStates.set(chatId, 'waitingAmount');
            break;
        case 'confirmTransfer':
            amount = new BigNumber(new BigNumber(message.text).toFixed(8, 0));
            if (!amount.isNaN() && amount.isGreaterThan(new BigNumber(0))) {
                bot.sendMessage(chatId, 'You entered: *' + amount + '* for transferring.', { parse_mode: 'Markdown'});
                const messageText3 = '*Confirm Transfer*\n Sending *<' + amount + 'ETH>* to *<' + recipientAddress + '>*';
                const confirmKeyboard = {
                    inline_keyboard: [
                        [
                            { text: '✅ Confirm', callback_data: 'confirm-transfer'},
                            { text: '❌ Cancel', callback_data: 'cancel-transfer' }
                        ],
                    ],
                };

                bot.sendMessage(chatId, messageText3, { parse_mode: 'Markdown', reply_markup: confirmKeyboard });
                userStates.set(chatId, 'initial');
            } else {
                bot.sendMessage(chatId, 'Please enter a valid amount for transferring:');
            }
            break;
        case 'confirmDeposit':
            amount = new BigNumber(new BigNumber(message.text).toFixed(8, 0));
            if (!isNaN(amount) && amount > 0) {
                bot.sendMessage(chatId, 'You entered: *' + amount + '* for deposit.', { parse_mode: 'Markdown'});
                const messageText3 = '*Confirm Deposit*\n Receiving *<' + amount + 'ETH>* from *<' + new ethers.Wallet(senderPrivateKey).address + '>*';
                const confirmKeyboard = {
                    inline_keyboard: [
                        [
                            { text: '✅ Confirm', callback_data: 'confirm-deposit'},
                            { text: '❌ Cancel', callback_data: 'cancel-deposit' }
                        ],
                    ],
                };

                bot.sendMessage(chatId, messageText3, { parse_mode: 'Markdown', reply_markup: confirmKeyboard });
                userStates.set(chatId, 'initial');
            } else {
                bot.sendMessage(chatId, 'Please enter a valid amount for transferring:');
            }
            break;
        case 'confirmSwap':
            amount = parseFloat(message.text);
            if (!isNaN(amount) && amount > 0) {
                bot.sendMessage(chatId, 'You entered: *' + amount + '* for swap.', { parse_mode: 'Markdown'});
                const messageText3 = '*Confirm Swap*\n *from ' + amount + tokenToSellAddress + ' to ' + tokenToBuyAddress;
                const confirmKeyboard = {
                    inline_keyboard: [
                        [
                            { text: '✅ Confirm', callback_data: 'confirm-swap'},
                            { text: '❌ Cancel', callback_data: 'cancel-swap' }
                        ],
                    ],
                };

                bot.sendMessage(chatId, messageText3, { parse_mode: 'Markdown', reply_markup: confirmKeyboard });
                userStates.set(chatId, 'initial');
            } else {
                bot.sendMessage(chatId, 'Please enter a valid amount for transferring:');
            }
            break;
        default:
            break;
    }
});

//function to select wallet type from wallet type list
function selectChain(chatId, network, nativeToken) {
    chainPlatform = network;
    nativeToken = nativeToken;

    const messageText = '*' + name + ' platform was selected successfully!*\n' + 
        'You are in the testnet now.\n  Please create or import wallet to use any functionality of this bot';
    const keyboard = {
        inline_keyboard: [
            [
                { text: '📧 Generate Wallet', callback_data: 'create-wallet'},
                { text: '📩 Import Wallet', callback_data: 'import-wallet' }
            ],
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode:'Markdown', reply_markup: keyboard });
}

//function to generate wallet
async function createWallet(chatId) {
    const wallet = IS_TEST ? new ethers.Wallet(myLocalPrivateKey) : ethWallet.default.generate();
    const address = IS_TEST ? wallet.address : wallet.getAddressString(); 
    const privateKey = IS_TEST ? myLocalPrivateKey : wallet.getPrivateKeyString();

    myWalletAddress = address;
    myWalletPrivateKey = privateKey;

    const balance = await modules.getBalance(myWalletAddress);
            
    const messageText = '*Wallet Generated Successfully!*\n' + 
        '*- Address:*\n' + myWalletAddress + '\n\n' + 
        '*- Balance:* ' + balance + nativeToken + '\n' +
        'What do you want to do with the bot?';

    const mainMenuKeyboard = {
        inline_keyboard: [
            [{ text: 'Transfer', callback_data: 'transfer'}, { text: 'Token Balances', callback_data: 'token-balances'}], 
            [{ text: 'Buy Tokens', callback_data: 'buy'}, { text: 'Sell Tokens', callback_data: 'sell'}], 
            [{ text: 'Buy Limit', callback_data: 'buy-limit'}, { text: 'Sell Limit', callback_data: 'sell-limit'}], 
            [{ text: 'Settings', callback_data: 'setting'}],
        ],
    };
    
    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: mainMenuKeyboard });
}

//function to import wallet
function importWallet(chatId) {
    bot.sendMessage(chatId, 'Please provide your Ethereum private key:');

    bot.once('message', (privateKeyMessage) => {
        const privateKey = IS_TEST ? myLocalPrivateKey : privateKeyMessage.text.trim();
        
        try {
            wallet = new ethers.Wallet(privateKey);
            address = wallet.address;
    
            bot.sendMessage(chatId, `*Wallet imported successfully!\nAddress:* ${address}`, { parse_mode: 'Markdown' });
        } catch (error) {
            bot.sendMessage(chatId, 'Error importing wallet. Please check the provided private key.');
            console.log(error.code);         
            console.log(error.message);
        }
    });
}

//function to select wallet type from wallet type list
function selectChain(chatId, type, name) {
    chainPlatform = type;
    const messageText = '*' + name + ' platform was selected successfully!*\n' + 
        'You are in the testnet now.\n  Please create or import wallet to use any functionality of this bot';
    const keyboard = {
        inline_keyboard: [
            [
                { text: '📧 Generate Wallet', callback_data: 'create-wallet'},
                { text: '📩 Import Wallet', callback_data: 'import-wallet' }
            ],
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode:'Markdown', reply_markup: keyboard });
}

function transfer(chatId) {
    bot.sendMessage(chatId, 'Please reply with the address to send:');
    bot.once('message', (address) => {
        recipientAddress = address.text.trim();
        bot.sendMessage(chatId, 'Please reply with the amount to send:');

        bot.once('message', (amount) => {
            amount = new BigNumber(new BigNumber(amount.text).toFixed(8, 0));
            if (!amount.isNaN() && amount.isGreaterThan(new BigNumber(0))) {
                bot.sendMessage(chatId, 'You entered: *' + amount + '* for transferring.', { parse_mode: 'Markdown'});
                const messageText3 = '*Confirm Transfer*\n Sending *<' + amount + 'ETH>* to *<' + recipientAddress + '>*';
                const confirmKeyboard = {
                    inline_keyboard: [
                        [
                            { text: '✅ Confirm', callback_data: 'confirm-transfer'},
                            { text: '❌ Cancel', callback_data: 'cancel-transfer' }
                        ],
                    ],
                };

                amountInWei = Web3.utils.toWei(amount.toFixed(8, 0), 'ether');
                bot.sendMessage(chatId, messageText3, { parse_mode: 'Markdown', reply_markup: confirmKeyboard });
            } else {
                bot.sendMessage(chatId, 'Invalid amount! Please enter again.');
            }
        });
    });
}

//function to select wallet type from wallet type list
function switchNet(chatId) {
    const messageText = '*Now, you are in the ' + netType + '!*\n You are in the mainnet now.\n If you want to switch net into other, please try this.\n';
    const keyboard = {
        inline_keyboard: [
            [
                { text: 'Mainnet', callback_data: 'switch-to-mainnet' },
                { text: 'Testnet', callback_data: 'switch-to-testnet' }
            ],
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
}

function trading(chatId) {
    const messageText1 = 'Please select the Token Name to sell :';
    const keyboard1 = {
        inline_keyboard: [
            [
                { text: 'DAI', callback_data: 'token-to-sell:DAI' },
                { text: 'ETH', callback_data: 'token-to-sell:ETH' },
                { text: 'USDT', callback_data: 'token-to-sell:USDT' }
            ],
            [
                { text: 'BNB', callback_data: 'token-to-sell:BNB' },
                { text: 'BNB', callback_data: 'token-to-sell:BNB' },
                { text: 'CTX', callback_data: 'token-to-sell:CTX' }
            ],
        ],
    };

    bot.sendMessage(chatId, messageText1, { parse_mode: 'Markdown', reply_markup: keyboard1 });
}

async function fetchPair(tokenToBuy, tokenToSell) {
    // You should implement logic to fetch the pair using Uniswap SDK or any other library
    // This is just a basic example, you need to replace it with actual implementation
    
    // Example: Create a pair using Uniswap SDK
    const pair = new Pair(
        new TokenAmount(tokenToBuy, '1000000000000000000'), // Replace with actual amounts
        new TokenAmount(tokenToSell, '2000000000000000000') // Replace with actual amounts
    );

    return pair;
}

function setTokenToSell(chatId, tokenToSell) {
    tokenToSellAddress = tokenToSell;
    const messageText2 = 'Please select the Token Name to buy :';
    const keyboard2 = {
        inline_keyboard: [
            [
                { text: 'DAI', callback_data: 'token-to-buy:DAI' },
                { text: 'ETH', callback_data: 'token-to-buy:ETH' },
                { text: 'USDT', callback_data: 'token-to-buy:USDT' }
            ],
            [
                { text: 'BNB', callback_data: 'token-to-buy:BNB' },
                { text: 'BNB', callback_data: 'token-to-buy:BNB' },
                { text: 'CTX', callback_data: 'token-to-buy:CTX' }
            ],
        ],
    };

    bot.sendMessage(chatId, messageText2, { parse_mode: 'Markdown', reply_markup: keyboard2 });
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

async function buy(chatId, address) {
    const messageText = 'Please select buy amount:';

    const buyAmountKeyboard = {
        inline_keyboard: [
            [
                { text: '0.1' + nativeToken, callback_data: 'input-buy-token:0.1' },
                { text: '0.3' + nativeToken, callback_data: 'input-buy-token:0.3' },
                { text: '0.5' + nativeToken, callback_data: 'input-buy-token:0.5' },
            ],
            [
                { text: '1' + nativeToken, callback_data: 'input-buy-token:1' },
                { text: 'Custom:--' + nativeToken, callback_data: 'custom-buy-token' },
            ],
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: buyAmountKeyboard });
}

function inputBuyToken(chatId, amount) {
    bot.sendMessage(chatId, 'Please input the token address to buy:');

    bot.once('message', (buyTokenMessage) => {
        const buyToken = buyTokenMessage.text.trim();
        const messageText = '*======= Please confirm the information ==========*\n' + 
            '*BuyTokenAddress: *' + buyToken +
            '\n*Amount: *' + amount + 
            '\n*Buy with: *' + nativeToken +
            '\nDo you really buy token?';
        
        const confirmKeyboard = {
            inline_keyboard: [
                [
                    { text: '✅ Confirm', callback_data: 'confirm-buy'},
                    { text: '❌ Cancel', callback_data: 'cancel-buy' }
                ],
            ],
        };

        bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: confirmKeyboard });
    });
}

function customBuyToken(chatId) {
    bot.sendMessage(chatId, 'Please input the custom buy amount:');

    bot.once('message', (buyTokenAmountMessage) => {
        const buyTokenAmount = buyTokenAmountMessage.text.trim();
        
        bot.sendMessage(chatId, 'Please input the token address to buy:');

        bot.once('message', (buyTokenMessage) => {
            const buyToken = buyTokenMessage.text.trim();
            const messageText = '*======= Please confirm the information ==========*\n' + 
                '*BuyTokenAddress: *' + buyToken +
                '\n*Amount: *' + buyTokenAmount + 
                '\n*Buy with: *' + nativeToken + 
                '\nDo you really buy token?';
            
            const confirmKeyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Confirm', callback_data: 'confirm-buy'},
                        { text: '❌ Cancel', callback_data: 'cancel-buy' }
                    ],
                ],
            };

            bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: confirmKeyboard });
        });
    });
}

async function sell(chatId) {
    const messageText = 'Please select sell amount:';

    const sellAmountKeyboard = {
        inline_keyboard: [
            [
                { text: '10%', callback_data: 'input-sell-token:10'},
                { text: '15%', callback_data: 'input-sell-token:15' },
                { text: '25%', callback_data: 'input-sell-token:25' },
            ],
            [
                { text: '50%', callback_data: 'input-sell-token:50' },
                { text: '75%', callback_data: 'input-sell-token:75' },
                { text: '100%', callback_data: 'input-sell-token:100' },
            ],
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: sellAmountKeyboard });
}

function inputSellToken(chatId, amount, txId) {
    const messageText = 'Please select receive token:';

    const receiveTokenKeyboard = {
        inline_keyboard: [
            [
                { text: 'ETH', callback_data: 'input-receive-token:ETH:' + amount },
                { text: 'USDC', callback_data: 'input-receive-token:USDC:' + amount }
            ]
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: receiveTokenKeyboard });
}

function inputReceiveToken(chatId, receiveToken, amount) {
    const messageText = '*======= Please confirm the information ==========*\n' + 
        '*ReceiveToken: *' + receiveToken +
        '\n*Amount: *' + amount + '%' +
        '\nDo you really  token?';
    
    const confirmKeyboard = {
        inline_keyboard: [
            [
                { text: '✅ Confirm', callback_data: 'confirm-sell'},
                { text: '❌ Cancel', callback_data: 'cancel-sell' }
            ],
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: confirmKeyboard });
}

function createTransaction(address, type) {
    const latestKey = transactions.length;
    const newTxId = (transactions.length == 0) ? 1 : transactions[latestKey].id + 1 ;

    switch (type) {
        case 'buy':
            transactions[newTxId] = { id: newTxId, type: type, senderAddress: address, recipient: address }
            break;
    }
    
    return newTxId;

}

async function getERC20TokenContracts(walletAddress) {
    try {
      const contract = new web3.eth.Contract(erc20TokenAbi);
  
      // Use the Transfer event to identify ERC-20 token contracts
      const transferEvents = await contract.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest',
        filter: { from: walletAddress },
      });
  
      const uniqueTokenContracts = Array.from(
        new Set(transferEvents.map(event => event.address))
      );
  
      // Create ERC-20 token contract instances
      const tokenContracts = uniqueTokenContracts.map(address => {
        return new ethers.Contract(address, erc20TokenAbi, new ethers.Wallet(myWalletPrivateKey));
      });
  
      return tokenContracts;
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

