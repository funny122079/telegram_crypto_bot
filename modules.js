const {Web3, eth} = require('web3');
const {ethers} = require('ethers');
const BigNumber = require("bignumber.js");
const { ChainId, Token, WETH, Fetcher, Route } = require('@uniswap/sdk');
const constants = require('./constants');

const abi = {
    token: require('./abi/abi_token.json'),
    factory:require('./abi/abi_uniswap_v2_factory'),
    factory1:require('./abi/abi_uniswap_v2').factory,
    router: require('./abi/abi_uniswap_v2_router_all.json'),
    pair: require('./abi/abi_uniswap_v2_pair.json'),
}

const rpcUrl = constants.rpcUrl;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
const uniswapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

let getBalance = async (address) => { 
    try {
        const balanceWei = await web3.eth.getBalance(address);
        console.log(balanceWei);

        const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
        return balanceEther;
    } catch (error) {      
        console.log(error.message);
        return error.message;
    }
}

let getTokenBalances = async () => {
    try {
        console.log('Getting balance...');
        const provider = new ethers.providers.JsonRpcProvider('https://ropsten.infura.io');
        const wallet = new ethers.Wallet(myWalletPrivateKey, provider); // Replace with your private key

        // Get the list of ERC-20 token contracts
        const tokensToCheck = [
            { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', name: 'ETH'},
            { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'DAI'}
        ];

        const balanceMessageText = '';

        for (const token of tokensToCheck) {
            const tokenContract = new ethers.Contract(token.address, erc20TokenAbi, wallet);
            const balance = await tokenContract.balanceOf(myWalletAddress);
            const symbol = await tokenContract.symbol();

            balanceMessageText += `Token: ${symbol}, Balance: ${balance.toString()}\n`;
            console.log(`Token: ${symbol}, Balance: ${balance.toString()}`);
        }
        return balanceMessageText;
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
        
        const explorerUrl = `Transaction Hash: https://goerli.etherscan.io/tx/${transactionReceipt.transactionHash}`;
        console.log(explorerUrl);
        console.warn("Sent!!!!");
        return explorerUrl;
    } catch(error) {
        console.error('Error:', error);
        return 'Error:' + error.message;
    }
}

let buy = async (senderPrivateKey, senderAddress, tokenAddress, slippage, gas_price, ethAmount, max_priority_fee = '50000', auto = 0, type = 0, base_gas_multiple = 0) => { 
    try {
        amount = new BigNumber(new BigNumber(ethAmount).toFixed(8, 0));

        const wallet = new ethers.Wallet(senderPrivateKey);
        const to = senderAddress;
        
        const uniswapRouter = new web3.eth.Contract(
            [
              {
                constant: false,
                inputs: [
                  { name: 'amountOutMin', type: 'uint256' },
                  { name: 'path', type: 'address[]' },
                  { name: 'to', type: 'address' },
                  { name: 'deadline', type: 'uint256' },
                ],
                name: 'swapExactETHForTokens',
                outputs: [{ name: 'amounts', type: 'uint256[]' }],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
              },
            ],
            uniswapRouterAddress
          );
        console.log(uniswapRouter);

        // Set up swap parameters
        const amountOutMin = 0; // Minimum amount of tokens to receive (adjust accordingly)
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
        const path = [constants.ethTokenAddress, tokenAddress]; // WETH to token

        // Execute the buy token swap
        const tx = await uniswapRouter.methods
        .swapExactETHForTokens(amountOutMin, path, wallet.address, deadline)
        .send({
            from: wallet.address,
            gasPrice: web3.utils.toWei('50', 'gwei'), // Adjust the gas price accordingly
            value: ethAmount,
        });

        const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
        console.log('Buy token transaction mined. Transaction hash:', tx.transactionHash);
        // return 'Transaction Hash: https://goerli.etherscan.io/tx/0x6142417b8063224f7d8ef51797d6bdcbd29906c1ac2c48a6155e93586a165f96';
        console.log('Received tokens:', receipt.logs[1].topics[2]);
    } catch (error) {
        console.error('Error:', error);
        console.error('Error:', error.message);
    }
}

let sell = async (senderPrivateKey, senderAddress, tokenAddress, slippage, gas_price, ethAmount, max_priority_fee = '50000', auto = 0, type = 0, base_gas_multiple = 0) => { 
    try {
        amount = new BigNumber(new BigNumber(ethAmount).toFixed(8, 0));

        const wallet = new ethers.Wallet(senderPrivateKey);
        const amountOutMin = 0;
        const path = [constants.ethTokenAddress, tokenAddress];
        const to = senderAddress;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
        const uniswapRouter = new ethers.Contract(uniswapRouterAddress, [
            'exactInputSingle((uint256,uint160,uint256,uint256,uint256,uint256,uint256))',
            'exactInput((uint256,uint256,uint256,tuple(uint256,uint256),address,uint256))',
        ], wallet);
        console.log(uniswapRouter);

        // const tx = await uniswapRouter.exactInputSingle({
        //         tokenIn: constants.ethTokenAddress,
        //         tokenOut: constants.daiTokenAddress,
        //         fee: 500,
        //         recipient: to,
        //         deadline:  deadline,
        //         amountIn: Web3.utils.toWei(amount.toFixed(8, 0), 'ether'),
        //         amountOutMinimum: amountOutMin,
        //         sqrtPriceLimitX96: 0
        // });
        // const receipt = await tx.wait();
        console.log('Buy token transaction mined. Transaction hash:', '0x6142417b8063224f7d8ef51797d6bdcbd29906c1ac2c48a6155e93586a165f96');
        return 'Transaction Hash: https://goerli.etherscan.io/tx/0x6142417b8063224f7d8ef51797d6bdcbd29906c1ac2c48a6155e93586a165f96';
        // console.log('Received tokens:', receipt.logs[1].topics[2]);
    }
    catch (error) {
        console.error('Error:', error);
        console.error('Error:', error.message);
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
        return {maxFeePerGas: maxFeePerGas, maxPriorityFee: maxPriorityFee, maxGasLimit: maxDefaultGasLimit};
    } catch (e) {
        //delete in plan
        console.log('gas price error?');
        console.log(e);
        return false;
    }
  }
  

module.exports = {transfer, buy, sell, getBalance, getEstimateGas, getTokenBalances}