const constants = require("../constants");

const mainMenuKeyboard = {
    inline_keyboard: [
        [{ text: '🟢 Buy Tokens', callback_data: 'buy'}, { text: '🔴 Sell Tokens', callback_data: 'sell'}], 
        [{ text: '📊 Limit Orders', callback_data: 'limit-orders'}, { text: '🎯 Snipe Orders', callback_data: 'snipe-orders'}], 
        [{ text: '💰 Wallet Management', callback_data: 'wallet-manage'}, { text: '🕐 Trade History', callback_data: 'trade-history'}], 
        [{ text: '⚙ User Settings', callback_data: 'setting'}, { text: '👩‍🏫 Invite', callback_data: 'invite'}],
    ],
};

const selectNetKeyboard = {
    inline_keyboard: [
        [{ text: 'Ethereum', callback_data: 'select-chain:Ethereum:ETH'}, { text: 'Polygon', callback_data: 'select-chain:Polygon:MATIC'}, { text: 'Arbitrum', callback_data: 'select-chain:Arbitrum:ARB'}],
    ],
};

const settingMenuKeyboard = {
    inline_keyboard: [
        [ { text: 'Mainnet / Testnet', callback_data: 'mainnet-testnet' }],
        [ { text: 'Private Key', callback_data: 'private-key' }],
    ],
};

const walletManageMainKeyboard = {
    inline_keyboard: [
        [ { text: '💰 W1', callback_data: 'wallet-detail:1' }, { text: '💰 W2', callback_data: 'wallet-detail:2' }, { text: '💰 W3', callback_data: 'wallet-detail:3' } ],
        [ { text: '⬅ Back', callback_data: 'back-to:main-menu' } ],
    ],
};

const walletDetailMenuKeyboard = (walletId) => {
    return {
        inline_keyboard: [
            [ { text: '📥 Import', callback_data: 'import-wallet:' + walletId }, { text: '♻ Regenerate', callback_data: 'regenerate-wallet:' + walletId }, { text: '🔑 Private Key', callback_data: 'private-key:' + walletId } ],
            [ { text: '💰 Portfolio', callback_data: 'portfolio:' + walletId }, { text: '🚀 Transfer Coin', callback_data: 'transfer-coin:' + walletId } ],
            [ { text: '⬅ Back', callback_data: 'back-to:wallet-menu' } ],
        ],
    }
}

module.exports = { 
    mainMenuKeyboard, selectNetKeyboard, settingMenuKeyboard, walletManageMainKeyboard, walletDetailMenuKeyboard 
}