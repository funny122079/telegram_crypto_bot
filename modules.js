const {Web3, eth} = require('web3');
const {ethers} = require('ethers');
const Moralis = require('moralis');
const BigNumber = require("bignumber.js");
const constants = require('./constants');
const axios = require('axios');
const abi = {
    token: require('./abi/abi_token.json'), 
    pancake: require('./abi/abi_pancake.json'),
}

const contractAddress = constants.swapContractAddress.pancakeSwap;
// get the latest Token price
let getTokenPrice = async(chainNetwork, tokenContractAddress) => {
    const chainPlatformID = constants.chainPlatformID[chainNetwork];
    const url = `https://api.coingecko.com/api/v3/simple/token_price/${chainPlatformID}?contract_addresses=${tokenContractAddress}&vs_currencies=usd`;

    const res = await axios.get(url);

    const tokenPrice = res !== null ? res.data[tokenContractAddress.toLowerCase()].usd : 0;
    console.log(`Token Price For : ${tokenPrice}$`);
    return tokenPrice;
}

// get Native Token Balance of current chain network.
let getBalance = async (rpcUrl, address) => { 
    try {
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        const balanceWei = await web3.eth.getBalance(address);

        const balanceEther = web3.utils.fromWei(balanceWei, 'ether');

        return parseFloat(balanceEther).toFixed(4);
    } catch (error) {      
        console.log(error.message);
        return error.message;
    }
}

// get balance of certain token balance of current chain network.
let getTokenBalance = async(tokenContractAddress, user) => {
    const provider = new ethers.JsonRpcProvider(user.rpcUrl);
    // Define ERC20 contract interface and address
    const erc20Interface = new ethers.Interface(['function balanceOf(address) external view returns (uint256)']);
  
    // Create contract instance
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Interface, provider);
    try {
        const balance = await tokenContract.balanceOf(user.wallet.publicAddress);
        console.log('Token Balance:', balance.toString());
        return balance;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// get all token balances of current chain network at onece.
let portfolio = async (user, wallet) => {
    const tokensInWallet = await axios.get(
        "https://deep-index.moralis.io/api/v2/" +
        wallet.publicAddress +
        "/erc20?chain=" + constants.chain[user.chainNetwork],
        {
            headers: {
                "X-API-Key":
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjMzMWU1NmVhLThjM2YtNDJlMy04Mzc5LWQ0NDA3ZWFiZDgwNSIsIm9yZ0lkIjoiMzc2MDQ2IiwidXNlcklkIjoiMzg2NDQwIiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiJlOTM1MGM0NS0yZmMxLTQ2MWQtYTMyYi1kMGFmNWUxMWUzNGUiLCJpYXQiOjE3MDc4MzI4NTYsImV4cCI6NDg2MzU5Mjg1Nn0.YsJtNvvr1zaIxdNwuAV4r2R3WuGKO4ab6B5X2illCSM",
            },
        }
    );
    const tokenBalances = tokensInWallet.data;

    const balanceResult = [];
    if (tokenBalances) {
        tokenBalances.map((item) => {
            if (!item.verified_contract) {
                return;
            }
            const balanceInWei = ethers.getBigInt(item.balance);
            const balanceInEther = ethers.formatUnits(balanceInWei, 'ether');

            const tokenBalanceObject = {
                name : item.name,
                symbol : item.symbol,
                balance : balanceInEther
            }
            balanceResult.push(tokenBalanceObject);
        })
    }
    return balanceResult;
}

// send coin to external wallet
let transfer = async (user) => { 
    try {
        const web3 = new Web3(new Web3.providers.HttpProvider(user.rpcUrl));
        const nonce = await web3.eth.getTransactionCount(user.wallet.publicAddress);
        
        const gasPrice = await web3.eth.getGasPrice();
        console.warn(gasPrice);
        
        const transaction = {
            from: user.wallet.publicAddress,   
            to: user.tx.recipientAddress,
            value: user.tx.amountInWei,
            gasPrice: gasPrice,
            gasLimit: "30000", // Gas limit for a standard ETH transfer
            nonce: nonce
        };
        // Sign the transaction
        const signedTransaction = await web3.eth.accounts.signTransaction(transaction, user.wallet.privateKey);
        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
        const explorerUrl = `Transaction Hash: ` + constants.explorerUrls[user.chainNetwork]+ `tx/${transactionReceipt.transactionHash}`;
        console.warn("Sent!!!!");
        return explorerUrl;
    } catch(error) {
        console.error('Error:', error);
        return 'Error:' + error.message;
    }
}

//send token holding in wallet to external wallet
let tokenTransfer = async (user) => {
    try {
      const provider = new ethers.JsonRpcProvider(user.rpcUrl);
      const wallet = new ethers.Wallet(
          `0x${user.wallet.privateKey}`,
          provider
      );

      const contract = new ethers.Contract(
          constants.tokenContractAddress[user.chainNetwork][user.tx.token],
          abi.token,
          wallet
      );

      console.log(user.tx.amountInWei)
      const unsignedTx = await contract.transfer.populateTransaction(user.tx.recipientAddress, user.tx.amountInWei);
      
      const transactionHash = (await wallet.sendTransaction(unsignedTx)).hash;

      // const result = await tx.wait()
      const explorerUrl = `https://bscscan.com/tx/${transactionHash}`;
      console.log('TransactionHash:' + transactionHash);
      return explorerUrl;
  } catch (error) {
      console.log(error);
      console.log('Error:' + error.message);
      return error.message;
  }
}

// Sell native token as much as certain percentage to other token.
let sell = async (user) => { 
  try {
      const provider = new ethers.JsonRpcProvider(user.rpcUrl);
      const wallet = new ethers.Wallet(
          `0x${user.wallet.privateKey}`,
          provider
      );

      const contract = new ethers.Contract(
          constants.swapContractAddress[user.chainNetwork],
          abi.pancake,
          wallet
      );

      const deadline = Math.floor((new Date()) / 1000) + 60;

      const unsignedTx = await contract.swapExactETHForTokens.populateTransaction(0, [constants.tokenContractAddress[user.chainNetwork]['MAIN'], constants.tokenContractAddress[user.chainNetwork][user.tx.receiveToken]], wallet.address, deadline,
        {
            value: user.tx.amountInWei,
        }
      );

      console.log('Sent!!!');
      const transactionHash = (await wallet.sendTransaction(unsignedTx)).hash;

      // const result = await tx.wait()
      const explorerUrl = `https://bscscan.com/tx/${transactionHash}`;
      console.log('TransactionHash:' + transactionHash);
      return explorerUrl;
  } catch (error) {
      console.log(error);
      console.log('Error:' + error.message);
      return error.shortMessage;
  }
}

// buy native token as much as input amount with other token hold in wallet.
let buy = async (user) => { 
  try {
    const provider = new ethers.JsonRpcProvider(user.rpcUrl);
    const wallet = new ethers.Wallet(
        `0x${user.wallet.privateKey}`,
        provider
    );

    const tokenContractAddress = constants.tokenContractAddress[user.chainNetwork][user.tx.buyWithToken];
    const tokenContract = new ethers.Contract(
        tokenContractAddress,
        abi.token,
        wallet
    );

    const tokenBalanceInWei = getTokenBalance(tokenContractAddress, user);
    const approveTx = await tokenContract.approve.populateTransaction(constants.swapContractAddress[user.chainNetwork], tokenBalanceInWei);
    const result = await wallet.sendTransaction(approveTx);
    if (!result.hash) {
        return "Transaction Approve Failed!";
    }

    const contract = new ethers.Contract(
        constants.swapContractAddress[user.chainNetwork],
        abi.pancake,
        wallet
    );

    const deadline = Math.floor((new Date()) / 1000) + 60;

    const unsignedTx = await contract.swapTokensForExactETH.populateTransaction(user.tx.amountInWei, tokenBalanceInWei, [tokenContractAddress, constants.tokenContractAddress[user.chainNetwork]['MAIN']], wallet.address, deadline);

    const recipient = (await wallet.sendTransaction(unsignedTx));

    const explorerUrl = `https://bscscan.com/tx/${recipient.hash}`;
    console.log('TransactionHash:' + recipient.hash);
    return explorerUrl;
  } catch (error) {
      console.log(error);
      console.log('Error:' + error.message);
      return error.shortMessage;
  }
}

let swap = async() => {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const wallet = new ethers.Wallet('0eb867a9a78cceefbc5cf4add6de45ff69337a63b641c5237e0110b7eb30651f', provider);

    // Define PancakeSwap Router address and ABI
    const routerAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E'; 
    const routerAbi = abi.pancake;

    const usdtAddress = '0x55d398326f99059ff775485246999027b3197955'; 
    const usdcAddress = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'; 

    // Initialize the router contract
    const router = new ethers.Contract(routerAddress, routerAbi, wallet);

    // Define swap parameters
    const amountIn = ethers.parseEther('0.1'); // Amount of USDT to swap (0.1 USDT)
    const amountOutMin = 0; // Minimum amount of USDC to receive
    const path = [usdtAddress, usdcAddress]; // USDT to USDC path

    // Set deadline for the swap transaction (20 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + 1200; // Current Unix time + 20 minutes

    try {
        // Execute the swap transaction
        const tx = await router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            wallet.address,
            deadline,
            { gasLimit: 500000 } // Adjust gas limit as needed
        )
        console.log('Swap transaction hash:', tx.hash);
    } catch (error) {
        console.error('Error during swap:', error);
    }
}

module.exports = { getTokenPrice, transfer, tokenTransfer, buy, sell, getBalance, getTokenBalance, portfolio, swap }