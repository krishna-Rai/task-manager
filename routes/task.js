const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks',auth,async(req,res)=>{
    try {
        const {description , completed } = req.body
        const task = new Task({
            description,
            completed,
            owner: req.user._id
        })
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(500).send(error.message)
    }
    
})
// GET /tasks?completed=true
// GET /tasks?limit=3&page=1
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks',auth, async (req,res)=>{
    try {
        const match = {}
        const sort = {}
        if(req.query.completed){
            match.completed = req.query.completed === 'true'
        }
        if(req.query.sortBy){
            const parts = req.query.sortBy.split(':')
            sort[parts[0]]=parts[1] === 'desc'?-1:1
        }
        const limit = req.query.limit || 3
        const page = req.query.page || 1
        const tasks = await Task.find({owner:req.user._id,...match}).sort(sort).skip((page-1)*limit).limit(limit).exec()
        res.send({
            page,
            count:tasks.length,
            tasks
        })
        // await req.user.populate({path:'tasks'})
        // res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

router.get('/task/:id',auth, async (req,res)=>{
    const id = req.params.id
    try {
        const task = await Task.findOne({_id: id, owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

module.exports = router