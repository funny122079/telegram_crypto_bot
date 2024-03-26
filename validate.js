const {Web3} = require('web3');
const modules = require('./modules');
const constants = require('./constants');

// validate that token contract address is available on specific chain network
let validateTokenAddress = async(user) => {
    const web3 = new Web3(new Web3.providers.HttpProvider(user.rpcUrl));
    let res;
    try {
        res = await web3.eth.getCode(user.tx.tokenAddressToBuyWith);
        console.log(res);
        if (res === '0x') {
            return {
                status: false,
                msg: `Token contract at this address does not exist on the ${user.chainNetwork} network.`
            }
        } 
		else {
            return {
                status: true,
                msg: `Token contract at this address exists on the ${user.chainNetwork} network.`
            }
        }
    } catch (error) {
        console.log("Error: ", error);
        return {
            status: false,
            msg: "Invalid Token Address! Please input again."
        }
    }
}

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
            msg: 'Insufficient Balance! Please input the amount again.'
        };
    }
    
    return {
        status: true,
        tokenAmount: needTokenAmount
    };
}

module.exports = { validateBuy, validateTokenAddress }