const mongoose = require('mongoose')

// Create schema 
// needed to create customized schema options IE timestamps
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        trim: true,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

// Create model
const Task = mongoose.model('Task', taskSchema)

module.exports = Task