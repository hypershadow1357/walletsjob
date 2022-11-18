const Web3 = require('web3')
const BigNumber = require('bignumber.js');
let web3
const chainRPCs = {
    BSC: 'https://bsc-dataseed.binance.org',
    ETH: 'https://rpc.ankr.com/eth',
    FTM: 'https://rpc.ftm.tools/'
}

const encodeCallData = (contract, method, ...params) => {
    return contract.methods[method](...params).encodeABI()
}

const estimateGas = async (txObj) => {
    return web3.eth.estimateGas(txObj)
}

const getGasPrice = async () => {
    return web3.eth.getGasPrice()
}

const getTransactionCount = async (senderAddress) => {
    return web3.eth.getTransactionCount(senderAddress, 'pending')
}

const sendSignedTransaction = async (rawTx) => {
    return new Promise((resolve, reject) => {
        web3.eth
            .sendSignedTransaction(rawTx)
            .once('transactionHash', (txHash) => {
                resolve(txHash)
            })
            .on('error', (error) => {
                reject(error)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

const signTransaction = async (privateKey, txObj) => {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey)
    const signedTx = await account.signTransaction(txObj)
    return {
        rawTx: signedTx.rawTransaction,
        txHash: signedTx.transactionHash,
    }
}

exports.changeChain = async (chain) => {
    console.log(chainRPCs[chain])
    const provider = new Web3.providers.HttpProvider(chainRPCs[chain])
    web3 = new Web3(provider)
}

exports.getReciverBalance = async ()=> {
    const balance = new BigNumber(await web3.eth.getBalance(process.env.RECIVER_ADDRESS))
    return balance.toString()
}

exports.transferChainCurrency = async (wallet) => {
    const balance = new BigNumber(await web3.eth.getBalance(wallet.address))
    const hardTokenBalance = new BigNumber(await web3.utils.toWei(process.env.HARD_TOKEN_BALANCE, "ether"))

    if (balance.isLessThanOrEqualTo(new BigNumber(await web3.utils.toWei(process.env.MIN_TOKEN_BALANCE, "ether")))) {
        return await transferHardBalance(wallet)
    }
    if (balance.isLessThanOrEqualTo(hardTokenBalance)) {
        return
    }

    const [nonce, gasPrice] = await Promise.all([
        getTransactionCount(wallet.address),
        getGasPrice()
    ])

    const txObj = {
        nonce,
        from: wallet.address,
        to: process.env.RECIVER_ADDRESS,
        value: balance.minus(hardTokenBalance).toString(),
    }

    txObj.gas = await estimateGas(txObj)
    txObj.gasPrice = gasPrice

    const { txHash, rawTx } = await signTransaction(wallet.pk, txObj)
    await sendSignedTransaction(rawTx)

    return txHash
}

const transferHardBalance = async (wallet) => {
    const balance = new BigNumber(await web3.eth.getBalance(wallet.address))
    const hardTokenBalance = new BigNumber(await web3.utils.toWei(process.env.HARD_TOKEN_BALANCE, "ether"))

    const [nonce, gasPrice] = await Promise.all([
        getTransactionCount(process.env.RECIVER_ADDRESS),
        getGasPrice()
    ])
    const txObj = {
        nonce,
        from: process.env.RECIVER_ADDRESS,
        to: wallet.address,
        value: hardTokenBalance.minus(balance).toString(),
    }
    txObj.gas = await estimateGas(txObj)
    txObj.gasPrice = gasPrice

    const { txHash, rawTx } = await signTransaction(process.env.RECIVER_PK, txObj)
    await sendSignedTransaction(rawTx)

    return txHash
}

exports.getContract = (abi, address) => {
    if (!abi || !address) return null
    return new web3.eth.Contract(abi, address)
}

exports.sendSignedTransaction = async (rawTx) => {
    return new Promise((resolve, reject) => {
        web3.eth
            .sendSignedTransaction(rawTx)
            .once('transactionHash', (txHash) => {
                resolve(txHash)
            })
            .on('error', (error) => {
                reject(error)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

exports.contractQuery = async (contract, method, ...params) => {
    const result = await contract.methods[method](...params).call()
    return result
}

exports.call = async (senderPrivateKey, senderAddress, contractAddress, contract, method, ...params) => {
    const [nonce, gasPrice, data] = await Promise.all([
        getTransactionCount(senderAddress),
        getGasPrice(),
        encodeCallData(contract, method, ...params),
    ])

    const txObj = {
        nonce,
        from: senderAddress,
        to: contractAddress,
        value: 0,
        data,
    }

    txObj.gas = await estimateGas(txObj)
    txObj.gasPrice = gasPrice

    const { txHash, rawTx } = await signTransaction(senderPrivateKey, txObj)
    await sendSignedTransaction(rawTx)

    return txHash
}

exports.getTransactionReceipt = async (txHash) => {
    return web3.eth.getTransactionReceipt(txHash)
}
