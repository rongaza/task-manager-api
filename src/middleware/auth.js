const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        // try/catch used if token comes back undefined
        // get token from header
        const token = req.header('Authorization').replace('Bearer ','')
        // verify token is valid
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // find user by decoded id and make sure token is part of tokens array
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})
        
        // if user not found
        if (!user) {
            throw new Error()
        }
        // add token to req
        req.token = token
        // assign user found
        req.user = user
        // run route handler after successful authentication
        next()
    } catch (error) {
        res.status(401).send({error: 'Please authenticate.'})
    }
}

module.exports = auth