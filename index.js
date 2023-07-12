const express = require('express')
const app = express()
const cors = require('cors')
const connectDB = require('./db/connect')
const User = require('./model/User')
const bodyParser = require('body-parser')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

// GET request for displaying all users
app.get('/api/users', async (req, res) => {
  // res.sendFile(__dirname + '/views/index.html')
  // const users = await User.find().select({username:1,_id:1})
  const users = await User.find()
  res.json({users:users})
});

// POST request for adding a new user
app.post('/api/users', async function (req, res) {
  const { username } = req.body
  const user = await User.create({ username: username })
  // console.log(user)
  res.json({username:user.username, _id:user.id})
})

// POST request for adding exercise
app.post('/api/users/:id/exercises', async function (req, res) {
  const { id } = req.params
  const { description, duration, date } = req.body

  const user = await User.findByIdAndUpdate(id, { $push: { exercises: { description, duration, date } } },{new:true})
  const lastExerciseDate = user.exercises.slice(-1)[0].date
  res.json({_id:user._id, username:user.username, description: description, duration: duration, date: lastExerciseDate.toDateString()})
})

// GET request for getting user exercises logs
app.get('/api/users/:id/logs', async function (req, res) {
  const { id } = req.params
  const user = await User.findById(id)
  if (!user) {
    return res.json({ message: "User not found" });
  }

  const exercises = JSON.parse(JSON.stringify(user.exercises))
  
  const count = user.exercises.length
  exercises.forEach(exercise => {
    exercise.date = new Date(exercise.date).toDateString()
    delete exercise._id
  })

  // console.log(user)
  res.json({ username: user.username, count: count, _id: user._id, log: exercises})
})

app.delete('/api', async function (req, res) {
  await User.deleteMany()
  res.json({msg:'Deleted Users'})
})

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(process.env.PORT || 3000, (port) => {
      console.log('Your app is listening on port ' + process.env.PORT || 3000)
    })
  } catch (error) {
    console.log(error)
  }  
}

start()