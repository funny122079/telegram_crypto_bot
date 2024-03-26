const { default: Web3 } = require("web3");

const welcomeText = '*Welcome to CryptiboBot!*\n' +  
        'We are providing high qualified service to grow your crypto trading business step by step.\n' +
        'Try it today and start automating the fantastic our several good and benefitable strategy with secure bot in our board.\n' +
        'You will spend short time and get big benefit.\n\n' +
        '*Commands*\n' +
        '#1. Use: /start to start this Bot\n' + 
        '#2. Use: /wallet to show all functions of your wallet\n' +
        '#3. Use: /network to switch the chain network - Ethereum, Polygon, Arbitrum';

const walletMainText = () => {
    let message = '<b>Greetings, from the Cryptibo Trading Bot</b>\n\n' + 
        'Cryptibo helps you to get the best benefits in the shortest period of time.\n' + 
        '*<a href="http://example.com">Website</a> || <a href="http://example.com">Documentation</a> || <a href="http://example.com">Discussion</a>*';
    return message;
}

const chainNetSelectedText = (chain, env) => {
    let message = '*' + chain + ' network was selected successfully!*\n\n' + 
        'You are in the *<' + env + '>* now.\n';

    return message;
}


const walletManageMainText = (user) => {
    let message = '*Manage Wallets*\n' +
        'To replace, regenerate or show the private key of a wallet, simply select which wallet you wish to manage using the buttons below.\n\n' +
        '*Wallets*';

    user.wallet.forEach(wallet => {
        message = message + '\n' + wallet.walletId + '. ' +
            wallet.publicAddress + '   ' +  wallet.balance;
    });
    
    message = message + '\n\n' + '*Select Option:*'
    return message;
}

const walletDeatilText = (wallet) => {
    let message = '*Wallet Detail*\n\n' + 'Wallet:\n' + 
        wallet.walletId + '. ' + wallet.publicAddress + '  ' + wallet.balance + 
        '\n\n*Select Option:*';
    return message;
}

const showPrivateKeyText = (wallet) => {
    let message = 'Here is the private key for this wallet:\n' +
        'Do not share this with anyone, as it may lead to funds being stolen!\n\n' +
        '*' + wallet.privateKey + '*';

    return message;
}

const showPortfolioText = (user, wallet, portfolio) => {
    let message = '*================ Wallet Assets ================*\n\n' +
        '*Chain Network: *' + user.chainNetwork + '\n' +
        '*Address: * ' + wallet.publicAddress + '\n' +
        '*Balance: * ' + wallet.balance + user.nativeToken + '\n\n';

    if (portfolio.length) {
        message += '*Holding Token Balances:*\n';
        portfolio.forEach(token => {
            message = message + '     *' +  token.name + ':* ' + parseFloat(token.balance).toFixed(4) + token.symbol + '\n';
        });
    } else {
        message = message + "⚠ There is no tokens holding in your wallet.\n";
    }
    return message;
}

const transferMainText = () => {
    let message = '🚀* Transfer *\n' +
        '*Chain Network: *' + 'Ethereum\n' +
        '*Wallet Address: *' + '0x23a69ede7d15680e26fb05992355131f1b7dff14\n' +
        '*Balance: *' + '0.0003ETH\n' +
        '*Max Amount for Transfer: *' + '0.00023ETH\n' +
        '*Estimated Fee: *' + '0.00007ETH';

    return message;
}

/////////////////////////////   Warning Messages  ////////////////////////////
const warningAdditionalPay = '*~~~~~~~~  Warning!  ~~~~~~~~*\nYou must pay additional fee for using this.\n Please select other one.';
const warningWalletExisted = '*~~~~~~~~  Warning!  ~~~~~~~~*\nYou cannot use another wallet because you already have own wallet using on this platform.\n ';
const warningBalance = 'Insufficient Balance! Please input amount again.';



/////////////////////////////   Error Messages   /////////////////////////////


module.exports = {  
    welcomeText, warningWalletExisted, warningAdditionalPay, warningBalance,
    walletMainText, chainNetSelectedText, walletManageMainText, walletDeatilText, showPrivateKeyText, showPortfolioText, transferMainText
}