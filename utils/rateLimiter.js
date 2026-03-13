const rateLimit = require("express-rate-limit")

const limiter = rateLimit({
    windowMs : 15 * 60 *1000,
    max : 100,
    standardHeaders : true,
    legacyHeaders : false,
    message : {
        status : 429,
        message :"Too many requests, please try again later."
    }
})

const authLimiter = rateLimit({
    windowMs : 2 * 60 * 1000,
    max : 10,
    standardHeaders : true,
    legacyHeaders : false,
    message : {
        status : 429,
        message :"Too many requests, please try again later."
    }
})


module.exports = {limiter,authLimiter}
