const constants = require("../constants");

const mainMenuKeyboard = {
    inline_keyboard: [
        [{ text: '↔ Send Coin', callback_data: 'transfer'}, { text: '💱 Token Balances', callback_data: 'token-balances'}], 
        [{ text: '🟢 Buy Tokens', callback_data: 'buy'}, { text: '🔴 Sell Tokens', callback_data: 'sell'}], 
        [{ text: '⬆ Buy Limit', callback_data: 'buy-limit'}, { text: '⬇ Sell Limit', callback_data: 'sell-limit'}], 
        [{ text: '📈 Trading', callback_data: 'trading'}, { text: '📊 PnL Analysis', callback_data: 'pnl-analysis'}],
        [{ text: '⚙ Settings', callback_data: 'setting'}],
    ],
};

const selectNetKeyboard = {
    inline_keyboard: [
        [{ text: 'Ethereum', callback_data: 'select-chain:Ethereum:ETH'}, { text: 'Polygon', callback_data: 'select-chain:Polygon:MATIC'}, { text: 'Arbitrum', callback_data: 'select-chain:Arbitrum:ARB'}],
    ],
};

const createOrImportKeyboard = {
    inline_keyboard: [
        [{ text: '📧 Generate Wallet', callback_data: 'create-wallet'}, { text: '📩 Import Wallet', callback_data: 'import-wallet' }],
    ],
}

const confirmTransferKeyboard = {
    inline_keyboard: [
        [{ text: '✅ Confirm', callback_data: 'confirm-transfer'}, { text: '❌ Cancel', callback_data: 'cancel-transfer' }],
    ],
};

const settingBuyLimitKeyboard = (user) => {
    const tokens = constants.receivableTokens[user.chainNetwork];
    let keyboard = [];
    
    tokens.map((token) => {
        const item = {
            text: token, callback_data:'select-buy-with-limit-token:' + token
        }
        keyboard.push(item);
    });
    
    let keyboard1 = []
    keyboard1.push([ { text: 'Select token to buy with: 📝', callback_data: 'nothing' }]);
    keyboard1.push(keyboard);
    const resultKeyboard =  keyboard1.concat([
        [ { text: 'Amount: 0.1ETH 📝', callback_data: 'input-buy-limit-amount' }, { text: 'DesiredBuyPrice:72h', callback_data: 'select-buy-limit-desire-price' }],
        [ { text: 'Add Order(%Price Change)', callback_data: 'select-buy-limit-token' }],
        [
            { text: '-10%', callback_data: 'select-buy-limit-change-price:10' },
            { text: '-20%', callback_data: 'select-buy-limit-change-price:20' },
            { text: '-30%', callback_data: 'select-buy-limit-change-price:30' },
        ],
        [
            { text: '-40%', callback_data: 'select-buy-limit-change-price:40' },
            { text: '-50%', callback_data: 'select-buy-limit-change-price:50' },
            { text: 'Custom', callback_data: 'select-buy-limit-change-price-custom' },
        ],
        [ { text: '+ Add Order', callback_data: 'do-buy-limit' } ],
    ])

    return {
        inline_keyboard: resultKeyboard
    }
}

const settingMenuKeyboard = {
    inline_keyboard: [
        [ { text: 'Mainnet / Testnet', callback_data: 'mainnet-testnet' }],
        [ { text: 'Private Key', callback_data: 'private-key' }],
    ],
};

const switchingEnvKeyboard = {
    inline_keyboard: [
        [ { text: 'Mainnet', callback_data: 'switch-to-mainnet' }, { text: 'Testnet', callback_data: 'switch-to-testnet' }],
        [ { text: 'Back', callback_data: 'back' } ],
    ],
};

const tradingSettingKeyboard = {
    inline_keyboard: [
        [ { text: '~~~~~~~~~~  Buy Options  ~~~~~~~~~~', callback_data: 'Buy Option' } ],
        [ { text: 'Amount to buy per tx', callback_data: 'nothing' }, { text: 'Desired token price to buy', callback_data: 'nothing' } ],
        [ { text: '--- ETH 📝', callback_data: 'trading-buy-amount' }, { text: '--- (ETH/USDT) 📝', callback_data: 'trading-desired-buy-price' } ],
        [ { text: 'Buy Times', callback_data: 'Buy Option' } ],
        [ { text: '--- 📝', callback_data: 'trading-buy-times' } ],
        [ { text: '~~~~~~~~~~  Sell Options  ~~~~~~~~~~', callback_data: 'Buy Option' } ],
        [ { text: 'Amount to sell per tx', callback_data: 'nothing' }, { text: 'Desired token price to sell', callback_data: 'nothing' }],
        [ { text: '--- % 📝', callback_data: 'trading-sell-amount' }, { text: '--- (ETH/USDT) 📝', callback_data: 'trading-desired-sell-price' } ],
        [ { text: 'Stop Loss', callback_data: 'nothing' } ],
        [ { text: '--- % 📝', callback_data: 'trading-stoploss' } ],
        [ { text: '~~~~~~~~~~  Interval Setting ~~~~~~~~~~', callback_data: 'Buy Option' } ],
        [ { text: 'Period', callback_data: 'nothing' }, { text: '--- s 📝', callback_data: 'trading-set-period' } ],
        [ { text: 'START', callback_data: 'trading-start' } ],
    ],
};

const selectSellAmountKeyboard = {
    inline_keyboard: [
        [
            { text: '10%', callback_data: 'select-sell-amount:10'},
            { text: '15%', callback_data: 'select-sell-amount:15' },
            { text: '25%', callback_data: 'select-sell-amount:25' },
        ],
        [
            { text: '50%', callback_data: 'select-sell-amount:50' },
            { text: '75%', callback_data: 'select-sell-amount:75' },
            { text: '100%', callback_data: 'select-sell-amount:100' },
        ],
        [
            { text: 'Custom', callback_data: 'input-sell-amount-custom' }
        ],
    ],
};

const confirmSellKeyboard = {
    inline_keyboard: [
        [
            { text: '✅ Confirm', callback_data: 'confirm-sell'},
            { text: '❌ Cancel', callback_data: 'cancel-sell' }
        ],
    ],
};

const receiveTokenKeyboard = (user) => {
    const tokens = constants.receivableTokens[user.chainNetwork];
    let keyboard = [];
    tokens.map((token) => {
        const item = {
            text: token, callback_data:'input-receive-token:' + token
        }
        keyboard.push(item);
    });

    return {
        inline_keyboard: [
            keyboard
        ]
    }
};

const buyAmountKeyboard = (user) => {
    return {
        inline_keyboard: [
            [
                { text: '0.1' + user.nativeToken, callback_data: 'select-buy-amount:0.1' },
                { text: '0.3' + user.nativeToken, callback_data: 'select-buy-amount:0.3' },
                { text: '0.5' + user.nativeToken, callback_data: 'select-buy-amount:0.5' },
            ],
            [
                { text: '1' + user.nativeToken, callback_data: 'select-buy-amount:1' },
                { text: 'Custom:--', callback_data: 'custom-buy-amount' },
            ],
        ]
    }
};

const buyWithTokenKeyboard = (user) => {
    const tokens = constants.receivableTokens[user.chainNetwork];
    let keyboard = [];
    tokens.map((token) => {
        const item = {
            text: token, callback_data:'select-buy-with-token:' + token
        }
        keyboard.push(item);
    });

    return {
        inline_keyboard: [
            keyboard
        ]
    }
};

const confirmBuyKeyboard = {
    inline_keyboard: [
        [
            { text: '✅ Confirm', callback_data: 'confirm-buy'},
            { text: '❌ Cancel', callback_data: 'cancel-buy' }
        ],
    ],
};

module.exports = { 
    mainMenuKeyboard, selectNetKeyboard, createOrImportKeyboard, confirmTransferKeyboard, settingBuyLimitKeyboard, buyAmountKeyboard,
    settingMenuKeyboard, switchingEnvKeyboard, tradingSettingKeyboard, selectSellAmountKeyboard, confirmBuyKeyboard, confirmSellKeyboard, receiveTokenKeyboard, buyWithTokenKeyboard 
}