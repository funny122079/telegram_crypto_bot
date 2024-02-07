const {Web3, eth} = require('web3');
const {ethers} = require('ethers');
const Moralis = require('moralis');
const BigNumber = require("bignumber.js");
const constants = require('./constants');
const abi = require("./abi.json");

const rpcUrl = constants.rpcUrl;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
const contractAddress = constants.contractAddress;

let getBalance = async (address) => { 
    try {
        const balanceWei = await web3.eth.getBalance(address);
        console.log(balanceWei);

        const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
        console.warn(balanceEther)
        return balanceEther;
    } catch (error) {      
        console.log(error.message);
        return error.message;
    }
}

let getTokenBalances = async () => {
    try {
        await Moralis.default.start({
            evmApiBaseUrl:'https://deep-index.moralis.io/api/v2.2/',
            apiKey: constants.moralis_api_key
        });

        const response = await Moralis.default.EvmApi.token.getWalletTokenBalances({
            'address' : '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326'
        });
        console.log('Success...' + response);
    } catch (error) {
        console.error('Error:', error.message);
        return error.message;
    }
}

let transfer = async (senderPrivateKey, senderAddress, recipientAddress, amountInWei) => { 
    try {
        // const amount = amountMessage.text.trim();
        const nonce = await web3.eth.getTransactionCount(senderAddress) ;
        
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

let buy = async (senderPrivateKey, tokenAmount) => { 
  try {
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

      const unsignedTx = await contract.swapExactETHForTokens.populateTransaction(0, [constants.wbnbTokenAddress, constants.usdtTokenAddress], wallet.address, deadline,
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

let sell = async (senderPrivateKey, tokenAmountPercent) => { 
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(
        `0x${senderPrivateKey}`,
        provider
    );

    const balanceWei = await web3.eth.getBalance(wallet.address);
    const balanceEther = web3.utils.fromWei(balanceWei, 'ether');

    const tokenToSellAmount = new BigNumber(new BigNumber(balanceEther).toFixed(8, 0)).times(new BigNumber(tokenAmountPercent));
    console.log("Balance: " + balanceEther);
    console.log("tokenToSellAmount: " + tokenToSellAmount);

    const contract = new ethers.Contract(
        contractAddress,
        abi,
        wallet
    );

    const amountIn = ethers.parseEther(tokenToSellAmount.toFixed(8, 0));
    console.log("Amount:" + amountIn);
    const deadline = Math.floor((new Date()) / 1000) + 60;

    const unsignedTx = await contract.swapTokensForExactETH.populateTransaction('0.05', '0.0005', [constants.usdtTokenAddress, constants.wbnbTokenAddress], wallet.address, deadline);
    
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

const getEstimateGas = async (base_gas_multiple = 0, max_priority_fee = 0, auto_type = 0) => {
    try {
        let baseGas;
        console.log('estimate Gas start for common module');
        await web3.eth.getGasPrice().then((result) => { baseGas = result; }); 
        
        let maxPriorityFee, baseMultiple;
        if (max_priority_fee > 0)
          maxPriorityFee = ethers.BigNumber.from(String(Math.ceil(max_priority_fee * (10**9))));
        else
          maxPriorityFee = ethers.BigNumber.from(String(Math.ceil(maxDefaultPriorityFee * (10**9))));
        
        if (base_gas_multiple > 0) 
          baseMultiple = base_gas_multiple;
        else
          baseMultiple = maxDefaultMulForMaxFee;
  
        let maxFeePerGas
  
        maxFeePerGas = ethers.BigNumber.from(baseGas)
            .mul(ethers.BigNumber.from(baseMultiple))
            .add(maxPriorityFee).add(ethers.BigNumber.from(String(Math.ceil(15 * (10**9)))));
        
        /***** TODO: Initial option from Koray, need to check? */
        // let feeData = await provider.send('eth_feeHistory', [2, 'latest', [25, 75, 90]]);
        // let maxFeePerGas = ethers.BigNumber.from(feeData.baseFeePerGas[feeData.baseFeePerGas.length - 1])
        // .mul(ethers.BigNumber.from(maxDefaultMulForMaxFee))
        // .add(maxPriorityFee);
        // console.log('baseGas: ' + (String(Math.ceil(baseGas / (10 ** 9)))) + " GWEI");
        // console.log('baseGas: ' + (String(Math.ceil(BigInt(baseGas) / BigInt(10 ** 9)))) + " GWEI");
        console.log('baseGas: ' + String(BigInt(baseGas) / BigInt(10 ** 9)) + " GWEI");
        console.log('maxFeePerGas: ' + Math.ceil(maxFeePerGas / (10 ** 9)) + " GWEI") 
        console.log('Max Priority Fee:' + Math.ceil(maxPriorityFee / (10 ** 9)) + " GWEI" );
        if (auto_type == 1) {
          maxFeePerGas = Math.ceil(maxFeePerGas / (10 ** 9)) 
          maxPriorityFee = Math.ceil(maxPriorityFee / (10 ** 9)) 
        }
        return {maxFeePerGas: maxFeePerGas, maxPriorityFee: maxPriorityFee, maxGasLimit: 60};
    } catch (e) {
        //delete in plan
        console.log('gas price error?');
        console.log(e);
        return false;
    }
  }
  
  
let handleBuy = async(private, owner_address, token_address, 
    slippage, gas_price, gas_limit, ethAmount, tokenAmount, max_priority_fee = 0, auto = 0, type = 0, base_gas_multiple = 0) => {
      try {
        let estimateGas = {};
  
        if (type == 2) { // when follow
          estimateGas.maxPriorityFee = 0;
          estimateGas.maxFeePerGas = 60;
        }
        else if (type == 1) { //when sniper
          estimateGas = await getEstimateGas(base_gas_multiple, max_priority_fee, 0);
          if (!estimateGas) {
            //Set default max fee per gas to 60 gwei once there is trouble to estimate gas fee..
            estimateGas.maxFeePerGas = 60;
            estimateGas.maxPriorityFee = 0;
          }
        }
        else {
          if (max_priority_fee >0) {
            estimateGas.maxPriorityFee = 0;
          }
          else
            estimateGas.maxPriorityFee = 0;
          
          if (gas_price ==0) {
            estimateGas = await getEstimateGas();
            if (!estimateGas) {
              //Set default max fee per gas to 60 gwei once there is trouble to estimate gas fee..
              estimateGas.maxFeePerGas = 60;
            }
          }
          else {
            estimateGas.maxFeePerGas = 60;
          }
        }
        estimateGas.maxGasLimit = 60;
        
        const wallet = new ethers.Wallet(private);
        const router = new ethers.Contract('0x8107e4d819e6523387985aD780C04dB69B208226', abi.router, wallet);
        const nonce = await web3.eth.getTransactionCount(owner_address);
  
        console.log('nonce' + nonce);
        
        const amountIn = ethAmount;
        const path = ['0xB8c77482e45F1F44dE1745F52C74426C631bDD52', token_address];
        const to = owner_address;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 1a0 minutes from
  
        //*** TODO: Get decimals part... unnecessary in uniswap v2? */
        //const contractInstance = new web3.eth.Contract(abi.token, token_address);
        //const decimals = await contractInstance.methods.decimals().call();
        
        // Encode the function call data
        const contract = new web3.eth.Contract(abi.router, uniswapRouterAddress);
  
        amountOutMin = 0;
        const tx = {
          from: owner_address,
          to: '0x8107e4d819e6523387985aD780C04dB69B208226',
          value: "10000",
          data: contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountOutMin,
            path,
            to,
            deadline
          ).encodeABI(),
          gasLimit:estimateGas.maxGasLimit,
          nonce: nonce,
          maxFeePerGas: estimateGas.maxFeePerGas,
          maxPriorityFeePerGas: estimateGas.maxPriorityFee,
          type: 2,
          chainId: 1,
        };
  
        try {
          const signedTx = await wallet.signTransaction(tx);
          
          if (signedTx) {
            console.log('Signed Tx was created');
            try {
              let receipt, finalReceipt;
              
                console.log('not simulation follow- came here');
                receipt = await wssprovider.sendTransaction(signedTx);
                console.log('receipt?');
                console.log(receipt);
                finalReceipt = await wssprovider.waitForTransaction(receipt.hash);
                console.log(finalReceipt);
                console.log(`|***********Buy Tx was mined in block: ${finalReceipt.blockNumber}`);
              // const receipt = true;
              if (finalReceipt.status === 1) return "success";
              else return "failed in waiting for transactions";
            }
            catch (error) {
              return error.message;
            }
          }
          else 
            return 'signed tx error, check it again';
        }
        catch (error) {
          console.log(error);
          return error.message;
        }
      }
      catch (e) {
        console.log(e); return e.message;
      }
  }

module.exports = {transfer, buy, sell, getBalance, getEstimateGas, getTokenBalances, handleBuy}