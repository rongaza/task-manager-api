const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')
// uploading images
const multer = require('multer')
// resizing images
const sharp = require('sharp')
const router = new express.Router()


// res.send() will use use JSON.stringify() for object being sent back

router.get('/test', (req, res) => {
  res.send('from a new file')
})

router.post('/users', async (req, res) => {
    // create new user
    const user = new User(req.body)
    try {
        await user.save()
        // send welcome email
        sendWelcomeEmail(user.email, user.name)
        // create user token
        const token = await user.generateAuthToken()
        // whatever comes next will not happen until promise is fullfilled
        res.status(201).send({ user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

// Login and verify user
router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        // only return public data about user using model instance method
        res.send({user, token})
    } catch (error) {
        res.status(400).send()
    }
})

// Logging Out
router.post('/users/logout', auth, async (req, res) => {
    try {
        // remove current token that user is logged in with
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// Log out all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// middleware authentication
// run route, then auth, and finally handler
// only way handler is run is if middleware runs
// the next() function
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

//updating an exisiting resource
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
	return res.status(400).send({ "error": "Invalid updates" })
  }

  try {
    const user = req.user
	updates.forEach((update) => {
	  user[update] = req.body[update]
	}) 
	await user.save()
	res.send(user)
  } catch (error) {
	// handle validation errors
	res.status(400).send(error)
  }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callBack) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            // returns error if not a match
            return callBack(new Error('Please upload a jpg image.'))
        }
        callBack(undefined, true)
    }
})

// router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
//     req.user.avatar = req.file.buffer
//     await req.user.save()
//     res.send()
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// })

router.post('/users/me/avatar', auth,  upload.single('avatar'), async (req, res) => {
    // using sharp to resize and convert to png
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()

    // function below is for express error handling
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message})
})

router.delete('/users/me/avatar/delete', auth, async(req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.delete('/users/me', auth, async (req, res) => {
  try {
    // remove user
    await req.user.remove()
    sendCancelEmail(req.user.email, req.user.name)
	res.send(req.user)
  } catch (error) {
	res.status(500).send()
  }
})

// fetching avatar pic
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        // set header field value and type
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

module.exports = router