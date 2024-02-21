const {Web3, eth} = require('web3');
const {ethers} = require('ethers');
const Moralis = require('moralis');
const BigNumber = require("bignumber.js");
const constants = require('./constants');
const axios = require('axios');
const abi = {
    token: require('./abi/abi_token.json'),
    pancake: require('./abi/abi.json'),
  }

const contractAddress = constants.contractAddress.pancakeSwap;

// get Native Token Balance of current chain network.
let getBalance = async (rpcUrl, address) => { 
    try {
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        const balanceWei = await web3.eth.getBalance(address);
        console.log(balanceWei);

        const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
        return balanceEther;
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

// get balance of certain token balance of current chain network.
let portfolio = async (user) => {
    console.log(user.wallet.publicAddress);
    const tokensInWallet = await axios.get(
        "https://deep-index.moralis.io/api/v2/" +
        user.wallet.publicAddress +
        "/erc20?chain=" + user.nativeToken,
        {
            headers: {
                "X-API-Key":
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjMzMWU1NmVhLThjM2YtNDJlMy04Mzc5LWQ0NDA3ZWFiZDgwNSIsIm9yZ0lkIjoiMzc2MDQ2IiwidXNlcklkIjoiMzg2NDQwIiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiJlOTM1MGM0NS0yZmMxLTQ2MWQtYTMyYi1kMGFmNWUxMWUzNGUiLCJpYXQiOjE3MDc4MzI4NTYsImV4cCI6NDg2MzU5Mjg1Nn0.YsJtNvvr1zaIxdNwuAV4r2R3WuGKO4ab6B5X2illCSM",
            },
        }
    );
    const tokenBalances = tokensInWallet.data;
    console.log("user wallet token list: ", tokenBalances);

    if(userWalletTokenList.length) {
        userWalletTokenList.map((token, index) => {
            const balanceInWei = ethers.BigNumber.from(token.balance);
            const decimals = token.decimals;

            const tokenBalance = balanceInWei.div((ethers.BigNumber.from(10)).pow(decimals));
            wallet.tokenList[index] = {
                symbol: token.symbol,
                balance: tokenBalance  
            }
        })
        console.log("Tokens of my wallet: ", wallet.tokenList);
    }
    return userWalletTokenList;
}

// send coin to external wallet
let transfer = async (senderPrivateKey, senderAddress, recipientAddress, amountInWei) => { 
    try {
        // const amount = amountMessage.text.trim();
        const nonce = await web3.eth.getTransactionCount(senderAddress);
        
        const gasPrice = await web3.eth.getGasPrice();
        console.warn(gasPrice);
        
        const transaction = {
            from: senderAddress,   
            to: recipientAddress,
            value: amountInWei,
            //gasPrice: "4100000000",
            gasPrice: gasPrice,
            gasLimit: "30000", // Gas limit for a standard ETH transfer
            nonce: nonce
        };
        // Sign the transaction
        const signedTransaction = await web3.eth.accounts.signTransaction(transaction, senderPrivateKey);
        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
        console.log(transactionReceipt);
        const explorerUrl = `Transaction Hash: https://bscscan.com/tx/${transactionReceipt.transactionHash}`;
        console.log(explorerUrl);
        console.warn("Sent!!!!");
        return explorerUrl;
    } catch(error) {
        console.error('Error:', error);
        return 'Error:' + error.message;
    }
}

// Sell native token as much as certain percentage to other token.
let sell = async (senderPrivateKey, tokenAmount) => { 
  try {
        // const balanceWei = await getTokenBalance(constants.usdtTokenAddress, wallet.address);
        // const balanceEther = web3.utils.fromWei(balanceWei, 'ether');

        // const tokenToSellAmount = new BigNumber(new BigNumber(balanceEther).toFixed(8, 0)).times(new BigNumber(tokenAmountPercent));
        // console.log("Balance: " + balanceEther);
        // console.log("tokenToSellAmount: " + tokenToSellAmount);

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(
          `0x${senderPrivateKey}`,
          provider
      );

      const contract = new ethers.Contract(
          contractAddress,
          abi,
          wallet
      );

      const bnbAmount = ethers.parseEther(tokenAmount);
      const deadline = Math.floor((new Date()) / 1000) + 60;

      const unsignedTx = await contract.swapExactETHForTokens.populateTransaction(0, [constants.tokenAddress.wbnb, constants.tokenAddress.usdt], wallet.address, deadline,
        {
            value: bnbAmount,
            gasLimit: 3000000,
        }
      );
      
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

// buy native token as much as input amount with other token hold in wallet.
let buy = async (privateKey, tokenToBuyAmount) => { 
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(
        `0x${privateKey}`,
        provider
    );

    const contract = new ethers.Contract(
        contractAddress,
        abi,
        wallet
    );

    const amountIn = ethers.parseEther('0.0001');
    console.log("Amount:" + amountIn);
    const deadline = Math.floor((new Date()) / 1000) + 60;

    const unsignedTx = await contract.swapExactTokensForETH.populateTransaction(amountIn, 0, [constants.tokenAddress.usdt, constants.tokenAddress.wbnb], wallet.address, deadline, {
        gasLimit: 3000000
    });
    
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

module.exports = {transfer, buy, sell, getBalance, getTokenBalance, portfolio }