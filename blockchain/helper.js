const web3 = require('./web3')
const tokenAbi = require('./abis/token.json')
const BigNumber = require('bignumber.js');

// const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS
// const tokenContract = web3.getContract(tokenAbi, tokenAddress)
let walletAddress = ''
let walletPrivateKey = ''

exports.changeChain = async (chain) => {
    await web3.changeChain(chain)
}

exports.getReciverBalance = async ()=> {
    return web3.getReciverBalance()
}

exports.setWallet = async ({ address, pk }) => {
    walletAddress = address
    walletPrivateKey = pk
}

exports.transferChainCurrency = async (wallet) => {
    await web3.transferChainCurrency(wallet)
}

exports.gettokenBalanceOfWallet = async (tokenAddress) => {
    const tokenContract = await web3.getContract(tokenAbi, tokenAddress)
    return new BigNumber(await web3.contractQuery(tokenContract, 'balanceOf', walletAddress)).toString()
}

exports.tranferTokenToBaseToken = async (tokenAddress) => {
    const amount = await this.gettokenBalanceOfWallet(tokenAddress)
    if (!amount || amount == '0') {
        return
    }
    const tokenContract = await web3.getContract(tokenAbi, tokenAddress)
    const to = process.env.RECIVER_ADDRESS
    const result = await web3.call(
        walletPrivateKey,
        walletAddress,
        tokenAddress,
        tokenContract,
        'transfer',
        to,
        amount,
    )
    return result
}

exports.getTransactionReceipt = async (txhash) => {
    return web3.getTransactionReceipt(txhash)
}
