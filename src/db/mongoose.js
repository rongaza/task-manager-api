const mongoose = require('mongoose')

// Connect to database

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})
