const express = require('express')
// connect to database
require('./db/mongoose')
// Setup seperate route files
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

// Setup express
const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
  console.log("Server is up on port: ", port)
})

