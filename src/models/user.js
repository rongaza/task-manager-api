const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

// needed for middleware (pre/post hooks)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('Password is cannot contain "password".')
      }
    }
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid')
      }
    }
  },
  age: {
    type: Number,
    default: 0,

    validate(value) {
      if (value < 0) {
        throw new Error('Age must be a postive number')
      }
    }
  },
  tokens: [{
      token: {
          type: String,
          required: true
      }
  }], 
  avatar: {
      type: Buffer
  }
}, {
    timestamps: true
})

// virtual property that is a relationship between two entities
// User -> Task
userSchema.virtual('tasks',{
    ref: 'Task',
    // User model field
    localField: '_id',
    // Task model field
    foreignField: 'owner'
})

// instance methods for each user/instance
// cannot use arrow functions

// toJSON used for res.send()
// this method is called whenever an instance of user model is being JSON.stringified
userSchema.methods.toJSON = function () {
    const user = this
    // get back raw data of user object
    const userObject = user.toObject()

    // remove private data    
    delete userObject.password
    delete userObject.tokens
    // remove avatar 
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    // generate token
    const token = jwt.sign({ _id: user.id.toString() },process.env.JWT_SECRET)

    // add token to model token array
    user.tokens = user.tokens.concat({ token: token })
    await user.save()

    return token
}

// model methods
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email: email })
    
    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    // If password is a match
    return user
}

// setup middleware pre/post hooks
// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
  const user = this

  // Hash the password
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this 
    await Task.deleteMany({ owner: user._id })
    next() 
})

// Create User database model
const User = mongoose.model('User', userSchema )

module.exports = User


// // Create new user
// const ron = new User({
//     name: '  Spanky  ',
//     email: 'spANKy@gmail.com  ',
//     password: 'fugarza'
// })

// // Save new user
// ron.save().then((ron) => {
//     console.log(ron)
// }).catch((error)=> {
//     console.log('Error: ', error)
// })