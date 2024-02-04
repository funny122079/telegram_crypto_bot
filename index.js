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
const myLocalPrivateKey = '0xf43b8e706477686f44c049fb85c8ea59273fcd3f2947941ee5ea6b2ad3b45ba5';
const myLocalAddress = '0xb03314c6cdaa5c34b9ccc4f1add7e9da9ef700be';

//This is Metamask wallet on Chrome browser.
const testMetaMaskPrivateKey = '0eb867a9a78cceefbc5cf4add6de45ff69337a63b641c5237e0110b7eb30651f';
const testMetaMaskAddress = '0x0086bDBD8475be37eBB584e0e2dc36A8c08e183E';

let senderPrivateKey, receiverAddress, amount;
let netType = 'testnet';
let chainPlatform = 'Ethereum';
let nativeToken = 'ETH';
let tokenToSellAddress; // e.g., ETH
let tokenToBuyAddress; // e.g., DAI
let amountToSwap;
let strategyNo;

const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const desiredBuyPrice = 1000; // Desired buy price in ETH
const desiredSellPrice = 2000; // Desired sell price in ETH
const stopLossPercentage = 4; // 4% stop loss

const rpcUrl = constants.rpcUrl;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

const dashboardMessage = 'What do you want to do with the bot?';

bot.onText(/\/start/, (msg) => {
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
            inputBuyToken(chatId, param1, param2);
            break;
        case 'custom-buy-token':
            customBuyToken(chatId, param1);
            break;
        case 'confirm-buy':
            bot.sendMessage(chatId, 'Start buying...');
            break;
        case 'cancel-buy':
            bot.deleteMessage(chatId, callbackQuery.message.message_id)
                .then(() => console.log('Message deleted successfully!'));
            break;
        case 'sell':
            sell(chatId, param1);
            break;
        case 'input-sell-token':
            inputSellToken(chatId, param1, param2);
            break;
        case 'input-receive-token':
            inputReceiveToken(chatId, param1, param2, param3);
            break;
        case 'custom-sell-token':
            customSellToken(chatId, param1);
            break;
        case 'confirm-sell':
            bot.sendMessage(chatId, 'Start selling...');
            break;
        case 'cancel-sell':
            bot.deleteMessage(chatId, callbackQuery.message.message_id)
                .then(() => console.log('Message deleted successfully!'));
            break;
        case 'check-balance':
            checkBalance(chatId);
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
            doTransfer(chatId);
            break;
        case 'cancel-transfer':
            deleteMessage(chatId);
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
                const messageText3 = '*Confirm Transfer*\n Sending *<' + amount + 'ETH>* to *<' + receiverAddress + '>*';
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
function createWallet(chatId) {
    const wallet = IS_TEST ? new ethers.Wallet(myLocalPrivateKey) : ethWallet.default.generate();
    const address = IS_TEST ? wallet.address : wallet.getAddressString(); 
    const privateKey = IS_TEST ? myLocalPrivateKey : wallet.getPrivateKeyString();

    walletArray[address] = { address: address, privateKey: privateKey, chain: chainPlatform, nativeToken: nativeToken };
    
    const messageText = '*Wallet Generated Successfully!*\n' + 
        '*- Address:*\n' + walletArray[address].address + '\n\n' + 
        '*- Balance:* 0 ETH\n' +
        'What do you want to do with the bot?';

    const mainMenuKeyboard = {
        inline_keyboard: [
            [{ text: 'Transfer', callback_data: 'transfer:' + address}, { text: 'Token Balances', callback_data: 'token-balances:' + address}], 
            [{ text: 'Buy Tokens', callback_data: 'buy:' + address}, { text: 'Sell Tokens', callback_data: 'sell:' + address}], 
            [{ text: 'Buy Limit', callback_data: 'buy-limit:' + address}, { text: 'Sell Limit', callback_data: 'sell-limit:' + address}], 
            [{ text: 'Settings', callback_data: 'setting:' + address}],
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

//function to get wallet information
async function checkBalance(chatId) {
    try {
        const balanceWei = await web3.eth.getBalance(address);

        const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
        console.log(balanceWei);
        bot.sendMessage(chatId, `*Balance for address * ${address}: \n ${balanceEther} ETH`, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, 'Error fetching wallet information. Please try again.');
        console.log(error.code);         
        console.log(error.message);
    }
}

function transfer(chatId) {
    bot.sendMessage(chatId, 'Please reply with the address to send:');

    // Set up a listener for the next message
    bot.once('message', (toAddressMessage) => {
        receiverAddress = IS_TEST ? testMetaMaskAddress : toAddressMessage.text.trim();
        bot.sendMessage(chatId, 'Please reply with the amount to send:');
        userStates.set(chatId, 'confirmTransfer');
    });
}

async function doTransfer(chatId) {
    try {
       // const amount = amountMessage.text.trim();
        const amountInWei = Web3.utils.toWei(amount.toFixed(8, 0), 'ether');

        const nonce = await web3.eth.getTransactionCount(address) ;
        const nextNonce = nonce + BigInt(1);
        //const nextNonce = nonce + BigInt(1);
        

        const gasPrice = await web3.eth.getGasPrice();
        console.warn(gasPrice);
       
        const transaction = {
            from: address,   
            to: receiverAddress,
            value: amountInWei,
            //gasPrice: "4100000000",
            gasPrice: gasPrice,
            gasLimit: "35000", // Gas limit for a standard ETH transfer
            nonce: nonce
        };
        // Sign the transaction
        const signedTransaction = await web3.eth.accounts.signTransaction(transaction, myLocalPrivateKey);
        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
        
        console.log(`Transaction Hash: https://goerli.etherscan.io/tx/${transactionReceipt.transactionHash}`);
        bot.sendMessage(chatId, `Transaction Hash: https://goerli.etherscan.io/tx/${transactionReceipt.transactionHash}`);
        console.warn("Sent!!!!");
    } catch(error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, error.message);
    }
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

//function for trading
async function doSwap(chatId) {
    try {
        const tokenToBuy = await Fetcher.fetchTokenData(1, tokenToBuyAddress);
        const tokenToSell = await Fetcher.fetchTokenData(1, tokenToSellAddress);
    
        const pair = await Fetcher.fetchPairData(tokenToBuy, tokenToSell);
        const route = new Route([pair], tokenToSell);
    
        const currentPrice = parseFloat(route.midPrice.toSignificant(6));
        
        console.log(`Current Price: ${currentPrice} ETH`);
    
        if (currentPrice <= desiredBuyPrice) {
            const amountToSell = ethers.utils.parseUnits('0.0001', 18); // Replace with the amount of tokens you want to sell
            const slippageTolerance = new Percent('50', '10000'); // 0.5% slippage tolerance
            const trade = new Trade(route, new TokenAmount(tokenToSell, amountToSell), TradeType.EXACT_INPUT);

            // Check if trade is within slippage tolerance
            if (trade.slippageTolerance.lessThan(slippageTolerance)) {
                console.log('Trade within slippage tolerance. Executing trade...');
    
                // Execute the trade (buy tokens)
                const uniswapRouter = new ethers.Contract(uniswapRouterAddress, ['function swapExactTokensForTokens(uint256,uint256,address[],address,uint256)'], wallet);
                
                // Set up parameters for swapExactTokensForTokens
                const path = [tokenToSellAddress, tokenToBuyAddress];
                const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
    
                const tx = await uniswapRouter.swapExactTokensForTokens(
                    amountToSell,
                    0, // Minimum amount of tokens to receive (0 for any)
                    path,
                    wallet.address,
                    deadline
                );
    
                console.log(`Transaction Hash: ${tx.hash}`);
            } else {
                console.log('Trade exceeds slippage tolerance. Skipping trade.');
            }
        } else if (currentPrice >= desiredSellPrice) {
          // Implement your sell order logic here
       
          console.log('Selling...');
        } else if (stopLossPercentage > 0) {
          const stopLossPrice = desiredBuyPrice - (desiredBuyPrice * stopLossPercentage) / 100;
          if (currentPrice <= stopLossPrice) {
            // Implement your stop-loss logic here
      
            console.log('Stop Loss Triggered...');
          }
        } else {
          console.log('No trading action taken. Price is within desired range.');
        }
      } catch (error) {
        console.error('Error:', error);
        console.error('Error:', error.message);
        bot.sendMessage(chatId, error.message);
      }
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
    const transactionId = await createTransaction(address, 'buy');
    const messageText = 'Please select buy amount:';

    const buyAmountKeyboard = {
        inline_keyboard: [
            [
                { text: '0.1' + walletArray[address].nativeToken, callback_data: 'input-buy-token:0.1:' + transactionId },
                { text: '0.3' + walletArray[address].nativeToken, callback_data: 'input-buy-token:0.3:' + transactionId },
                { text: '0.5' + walletArray[address].nativeToken, callback_data: 'input-buy-token:0.5:' + transactionId },
            ],
            [
                { text: '1' + walletArray[address].nativeToken, callback_data: 'input-buy-token:1:' + transactionId },
                { text: 'Custom:--' + walletArray[address].nativeToken, callback_data: 'custom-buy-token:' + transactionId },
            ],
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: buyAmountKeyboard });
}

function inputBuyToken(chatId, amount, txId) {
    bot.sendMessage(chatId, 'Please input the token address to buy:');

    bot.once('message', (buyTokenMessage) => {
        const buyToken = buyTokenMessage.text.trim();
        const tx = transactions[txId];
        const messageText = '*======= Please confirm the information ==========*\n' + 
            '*BuyTokenAddress: *' + buyToken +
            '\n*Amount: *' + amount + 
            '\n*Buy with: *' + walletArray[tx.senderAddress].nativeToken +
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

function customBuyToken(chatId, amount, txId) {
    bot.sendMessage(chatId, 'Please input the custom buy amount:');

    bot.once('message', (buyTokenAmountMessage) => {
        const buyTokenAmount = buyTokenAmountMessage.text.trim();
        
        bot.sendMessage(chatId, 'Please input the token address to buy:');

        bot.once('message', (buyTokenMessage) => {
            const buyToken = buyTokenMessage.text.trim();
            const tx = transactions[txId];
            const messageText = '*======= Please confirm the information ==========*\n' + 
                '*BuyTokenAddress: *' + buyToken +
                '\n*Amount: *' + amount + 
                '\n*Buy with: *' + walletArray[tx.senderAddress].nativeToken + 
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

async function sell(chatId, address) {
    const transactionId = await createTransaction(address, 'sell');
    const messageText = 'Please select sell amount:';

    const sellAmountKeyboard = {
        inline_keyboard: [
            [
                { text: '10%', callback_data: 'input-sell-token:10:' + transactionId },
                { text: '15%', callback_data: 'input-sell-token:15:' + transactionId },
                { text: '25%', callback_data: 'input-sell-token:25:' + transactionId },
            ],
            [
                { text: '50%', callback_data: 'input-sell-token:50:' + transactionId },
                { text: '75%', callback_data: 'input-sell-token:75:' + transactionId },
                { text: '100%', callback_data: 'input-sell-token:100:' + transactionId },
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
                { text: 'ETH', callback_data: 'input-receive-token:ETH:' + amount + ':' + txId },
                { text: 'USDC', callback_data: 'input-receive-token:USDC:' + amount + ':' + txId }
            ]
        ],
    };

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown', reply_markup: receiveTokenKeyboard });
}

function inputReceiveToken(chatId, receiveToken, amount, txId) {
    const messageText = '*======= Please confirm the information ==========*\n' + 
        '*ReceiveToken: *' + receiveToken +
        '\n*Amount: *' + amount + 
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


