const CronJob = require('cron').CronJob
const helper = require('./blockchain/helper')
const env = require('./env')
const walletAddresses = require('./wallets.json')
const tokenAddresses = require('./tokenAddresses.json')

const jobTime = `0 */${process.env.RUN_TIME_PER_MINUTES} * * * *`
const jobMoveTokens = new CronJob(jobTime, function () {
    console.log(new Date())
    moveTokensToReciverAccount()
})

async function moveTokensToReciverAccount() {
    for (const chain in tokenAddresses) {
        await helper.changeChain(chain)
        let flag = true
        if((await helper.getReciverBalance()) == '0'){
            continue
        }
        for (const token in tokenAddresses[chain]) {
            const tokenAddress = tokenAddresses[chain][token].address
            for (const j in walletAddresses) {
                if (flag) {
                    await helper.transferChainCurrency(walletAddresses[j])
                }
                // console.log('transfer tokens to', walletAddresses[j], 'from ' + tokenAddress)
                await helper.setWallet(walletAddresses[j])
                await helper.tranferTokenToBaseToken(tokenAddress)
            }
            flag = false
        }
    }

}

jobMoveTokens.start()