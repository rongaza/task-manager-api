const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        // taken from auth method
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(404).send
    }
})

// Get /tasks?completed=false
// Pagination -> limit or skip ( is the # of entries you want to skip)
// Get /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    // let completed = ''

    if (req.query.completed) {
        // set match.completed to true/false
        // completed = req.query.completed === 'true'
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        // sets sort["filedname"] = sort."fieldname"
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1

    }

    try {
        // const tasks = await Task.find({
        //     owner: req.user._id,
        //     completed
        // })
        // res.send(tasks)
        // or
        await req.user.populate({
            // property name to populate
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id

  try {
    const task = await Task.findOne({_id, owner: req.user._id})

    if (!task) {
        return res.status(404).send()
    }

    res.send(task)
  } catch (error) {
      res.status(500).send()
  }

//   Task.findById(_id).then((task) => {
//     if (!task) {
//       res.sendStatus(404).send()
//     }

//     res.send(task)
//   }).catch((e) => {
//     res.sendStatus(500).send()
//   })
})

// task updates
router.patch('/tasks/:id', auth, async (req, res) => {
    // handle validation errors
    const updates = Object.keys(req.body)
    const allowedUpdates = ['completed', 'description']
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if (!isValidOperation) {
        return res.status(400).send({ "error": 'Invalid Updates' })
    }

  try {
    const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
    
    if (!task) {
        res.status(404).send()
    }

    updates.forEach((update) => {
        task[update] = req.body[update]
    })
    await task.save()
    res.send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id })

        if (!task) {
        res.status(404).send()
        }

        res.status(200).send(task)
    } catch (error) {
        res.status(500).send()
    }
})

module.exports = router