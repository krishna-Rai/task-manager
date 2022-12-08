const jwt = require('jsonwebtoken')
const User = require('../models/user')
const auth = (req,res,next)=>{
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(!token) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,async (err,user)=>{
        if(err) return res.sendStatus(403)
        const userFound = await User.findOne({_id:user.id})
        req.user = userFound
        next()
    })
}

module.exports = auth