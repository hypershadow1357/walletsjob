const path = require('path')

require('dotenv').config({
    path: path.join(__dirname, '.env')
})

exports.get = (key, defaultValue) => {
    return process.env[key] || defaultValue
}

exports.getOrFail = (key) => {
    const val = process.env[key]
    if (val === undefined) {
        throw new Error(`Make sure to define environment variable ${key}.`)
    }
    return val
}
