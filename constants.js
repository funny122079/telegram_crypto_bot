module.exports = {
    moralis_api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImZlZDJmYzM0LTIzZDUtNDFmMi1iYjM3LTFhZDdhNjM1YmZmNCIsIm9yZ0lkIjoiMzc2MDQ2IiwidXNlcklkIjoiMzg2NDQwIiwidHlwZUlkIjoiZTkzNTBjNDUtMmZjMS00NjFkLWEzMmItZDBhZjVlMTFlMzRlIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MDcyMzExNjUsImV4cCI6NDg2Mjk5MTE2NX0.C3uQdmsFYJivPhhs825uZ3Bs4KB7kaeAmHnAlvJRgxE',
    tokenContractAddress: {
        'Ethereum': {
            'WETH' : '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',  
            'USDT' : '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            'USDC' : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' 
        },
        'BSC': {
            'WBNB' : '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
            'ETH' : '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
            'DAI' : '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            'USDT' : '0x55d398326f99059fF775485246999027B3197955',
            'USDC' : '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
        }
    },
    chain: {
        'Ethereum': 'eth',
        'Polygon': 'polygon',
        'Arbitrum': 'arbitrum'
    }, 
    swapContractAddress: {
        'Ethereum': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',       //uniswap v2
        'Polygon': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',        //uniswap v2
        'Arbitrum': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',        //uniswap v2
        'BSC': '0x10ED43C718714eb63d5aA57B78B54704E256024E'             //pancakeSwap
    }, 
    rpcUrls: {
        'mainnet': {
            'Ethereum': 'https://mainnet.infura.io/v3/276601773a5841a29cd363a970f5a293',
            'Polygon': 'https://polygon-pokt.nodies.app',                         //https://polygon-mainnet.infura.io/v3/276601773a5841a29cd363a970f5a293
            'Arbitrum': 'https://api.zan.top/node/v1/arb/one/public',             //https://arbitrum-mainnet.infura.io/v3/276601773a5841a29cd363a970f5a293
            'BSC': 'https://bsc-dataseed.binance.org/', 
        }, 

        'testnet' : {
            'Goerli': 'https://goerli.drpc.org/',                                //https://goerli.infura.io/v3/276601773a5841a29cd363a970f5a293
            'Polygon Mumbai': 'https://polygon-mumbai-bor.publicnode.com',       //https://polygon-mumbai.infura.io/v3/276601773a5841a29cd363a970f5a293
            'Arbitrum Goerli': 'https://arbitrum-goerli.publicnode.com',         //https://arbitrum-goerli.infura.io/v3/276601773a5841a29cd363a970f5a293
            'BSC Testnet': 'https://bsc-testnet.publicnode.com'
        }
    },
    explorerUrls: {
        'Ethereum': 'https://etherscan.io/',
        'Polygon': 'https://polygonscan.com/',
        'Arbitrum': 'https://arbiscan.io/',
        'BSC': 'https://bscscan.com/'
    }
};



