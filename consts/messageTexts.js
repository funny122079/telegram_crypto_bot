const welcomeText = '*Welcome to CryptiboBot!*\n' +  
        'We are providing high qualified service to grow your crypto trading business step by step.\n' +
        'Try it today and start automating the fantastic our several good and benefitable strategy with secure bot in our board.\n' +
        'You will spend short time and get big benefit.\n\n' +
        '*Commands*\n' +
        '#1. Use: /start to start this Bot\n' + 
        '#2. Use: /wallet to show all functions of your wallet\n' +
        '#3. Use: /network to switch the chain network - Ethereum, Polygon, Arbitrum';

const inputPVTText = 'Please provide your Ethereum private key:';
const inputTransferRecipientText= 'Please reply with the address to send:';
const inputTransferAmountText= 'Please reply with the amount to send:';
const selectTokenToSell = 'Please select the Token Name to sell :';

const walletMainText = (address, balance, nativeToken) => {
    let message = '*~~~~~~~~~ Your Wallet ~~~~~~~~~*\n' + 
        '*- Address:*\n' + address + '\n\n' + 
        '*- Balance:* ' + balance + nativeToken + '\n' +
        'What do you want to do with the bot?';
    return message;
}

const walletGeneratedText = (address) => {
    let message = '*Wallet Generated Successfully!*\n' + 
        '*- Address:*\n' + address + '\n\n' + 
        'What do you want to do with the bot?';

    return message;
}

const walletImportedText = (address, balance, nativeToken) => {
    let message = `*Wallet imported successfully!\nAddress:* ${address}` +
        '*- Balance:* ' + balance + nativeToken + '\n';

    return message;
}

const chainNetSelectedText = (chain, env) => {
    let message = '*' + chain + ' network was selected successfully!*\n\n' + 
        'You are in the *<' + env + '>* now.\n' +
        'Please create or import wallet to use of this bot';

    return message;
}

const confirmTransferText = (nativeToken, amount, recipient) => {
    let message = '*Confirm Transfer*\n Sending *<' + amount + nativeToken + '>* to *<' + recipient + '>*';
    
    return message;
}

const confirmSellText = (receiveToken, amount) => {
    let message = '*======= Please confirm the information ==========*\n' + 
        '*ReceiveToken: *' + receiveToken +
        '\n*Amount: *' + amount + '%' +
        '\nDo you really  token?';

    return message;
}

const confirmBuyText = (buyToken, buyTokenAmount, nativeToken) => {
    let message = '*======= Please confirm the information ==========*\n' + 
        '*BuyTokenAddress: *' + buyToken +
        '\n*Amount: *' + buyTokenAmount + 
        '\n*Buy with: *' + nativeToken + 
        '\nDo you really buy token?';

    return message;
}

const pnlAnalysisText = (net, amount, nativeToken) => {
    let message = 'Generating PnL!\n\n' + 
        'You have not done a ny trades with the bot!\n\n' +
        '*Chain Selected: *' + net + '\n\n' +
        '*~~~ Profit & Loss (PnL) Analysis ~~~*\n' +
        'Total PnL: ' + amount + nativeToken;

    return message;
}

/////////////////////////////   Warning Messages  ////////////////////////////
const warningAdditionalPay = '*~~~~~~~~  Warning!  ~~~~~~~~*\nYou must pay additional fee for using this.\n Please select other one.';
const warningWalletExisted = '*~~~~~~~~  Warning!  ~~~~~~~~*\nYou cannot use another wallet because you already have own wallet using on this platform.\n ';



/////////////////////////////   Error Messages   /////////////////////////////


module.exports = {  
    welcomeText, inputPVTText, inputTransferRecipientText, inputTransferAmountText, selectTokenToSell, warningAdditionalPay, warningWalletExisted, 
    walletMainText, walletGeneratedText, walletImportedText, chainNetSelectedText, confirmTransferText, confirmSellText, confirmBuyText, pnlAnalysisText 
}