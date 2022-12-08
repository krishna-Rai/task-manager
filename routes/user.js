const User = require('../models/user')
const express = require('express')
const router = new express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')
const config = require('../config')

router.post('/users/register', async (req,res)=>{

    const {email,password,name,age } = req.body
    const userFound = await User.findOne({email})
    if(userFound){
        res.send({
            "message":"Email has already been taken"
        })
    }else{
        const user = new User({
            email,
            password,
            name,
            age
        })
        const userCreated = await user.save()
        res.status(201).send(userCreated)
    }
})

router.post('/users/login', async (req,res)=>{
    const {email,password} = req.body
    const userFound = await User.findOne({email})
    if(!userFound){
        return res.send({
            "message":"No such user with this email"
        })
    }
    const passwordMatch = await bcrypt.compare(password,userFound.password)
    if(!passwordMatch){
        return res.send({
            "message":"Password in incorrect"
        })
    }
    // generate a jwt token
    const accessToken = jwt.sign({id:userFound._id},process.env.ACCESS_TOKEN_SECRET, {expiresIn:  `${process.env.ACCESS_TOKEN_EXPIRY}s`})
    const refreshToken = jwt.sign({id:userFound._id},process.env.REFRESH_TOKEN_SECRET, {expiresIn: `${process.env.REFRESH_TOKEN_EXPIRY}d`})
    // const updateUser = await User.updateOne({email},{$set:{refreshToken}})
    userFound.tokens.push({
        token:refreshToken
    })
    await userFound.save()
    res.send({
        accessToken,
        refreshToken
    })
})

// a user should be able to see only his/her details
router.get('/users/me',auth,async (req,res)=>{
    res.send(req.user)
})

router.patch('/users/me',auth, async (req,res)=>{
    const allowedUpdates = config.allowedUpdates
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if(!isValidOperation){
        return res.status(400).send({error: "Invalid updates!"})
    }
    try {
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

router.delete('/users/me',auth, async (req,res)=>{
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/token',async(req,res)=>{
    const refreshTokenExists = (userFound,refreshToken)=>{
        let exists = false
        userFound.tokens.forEach((token)=>{
            if(token.token == refreshToken){
                exists = true
            }
        })
        return exists
    }
    const refreshToken = req.body.refreshToken
    if(!refreshToken) return res.sendStatus(401)
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,async (err,user)=>{
        if(err) return res.sendStatus(403)
        const userFound = await User.findOne({_id:user.id})
        if(userFound && refreshTokenExists(userFound,refreshToken)){
            const accessToken = jwt.sign({id:userFound._id},process.env.ACCESS_TOKEN_SECRET, {expiresIn:  `${process.env.ACCESS_TOKEN_EXPIRY}s`})
            res.send({
                accessToken
            })
        }else{
            res.sendStatus(403)
        }
    })

})

router.post('/users/logout',auth,async (req,res)=>{
    try {
        const refreshToken = req.body.refreshToken
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== refreshToken
        })
        await req.user.save()
        res.send({
            message:"Logged out successfully"
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
})

router.post('/users/logoutall',auth,async (req,res)=>{
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send(error.message)
    }
})

module.exports = router