const {Web3} = require('web3');
const modules = require('./modules');
const constants = require('./constants');

//get token price using for buy token and validate balance.
let validateBuy = async(user, token) => {
    const nativeTokenPrice = await modules.getTokenPrice(user.chainNetwork, constants.tokenContractAddress[user.chainNetwork]['MAIN']);
    const otherTokenPrice = await modules.getTokenPrice(user.chainNetwork, constants.tokenContractAddress[user.chainNetwork][token]);

    const otherTokenBalance = await modules.getTokenBalance(constants.tokenContractAddress[user.chainNetwork][token], user);
    const balanceInEther = Web3.utils.fromWei(otherTokenBalance, 'ether');
    
    const needTokenAmount = nativeTokenPrice / otherTokenPrice * user.tx.amount;
    console.log("Need token amount: ", needTokenAmount);
    console.log("Token Balance: ", balanceInEther);
    
    if (parseFloat(needTokenAmount) > parseFloat(balanceInEther)) {
        return {
            status: false, 
        };
    }
    
    return {
        status: true,
        tokenAmount: needTokenAmount
    };
}

module.exports = { validateBuy }