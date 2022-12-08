const express = require('express')
require('./db/mongoose')
const dotenv = require('dotenv')
dotenv.config()
const userRouter = require('./routes/user')
const taskRouter = require('./routes/task')


const app = express()
const port = process.env.PORT || 3000
app.use(express.json())

app.use(userRouter)
app.use(taskRouter)

app.listen(port,()=>{
    console.log("Server is up and running on port "+ port)
})


// register, login, create a task item, update a task, delete a task, 
// fetch all his task, fetch a single task