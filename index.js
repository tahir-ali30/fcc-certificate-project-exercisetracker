const express = require('express')
const app = express()
const cors = require('cors')
const connectDB = require('./db/connect')
const User = require('./model/User')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html')  
})

// GET request for displaying all users
app.get('/api/users', async (req, res) => {
  const users = await User.find()
  res.json({users:users})
});

// POST request for adding a new user
app.post('/api/users', async function (req, res) {
  const { username } = req.body
  const user = await User.create({ username: username })
  res.json({username:user.username, _id:user.id})
})

// POST request for adding exercise
app.post('/api/users/:id/exercises', async function (req, res) {
  const { id } = req.params
  const { description, duration, date } = req.body

  const user = await User.findByIdAndUpdate(id, { $push: { exercises: { description, duration, date } } },{new:true})
  const lastExerciseDate = user.exercises.slice(-1)[0].date

  const userRes = { username: user.username, description: description, duration: duration, date: lastExerciseDate.toDateString(), _id: user._id }

  res.json(userRes)
})

// GET request for getting user exercises logs
app.get('/api/users/:id/logs', async function (req, res) {
  const { id } = req.params
  let { from, to, limit } = req.query
  
  from = (from) ?? new Date(0)
  to = (to) ?? new Date()
  limit = isNaN(limit) ? 1000 : parseInt(limit)

  const user = await User.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }, { $unwind: '$exercises' }, { $match: { 'exercises.date': { $gte: new Date(from), $lte: new Date(to) } } }, { $limit: limit } ] )

  if (!user) {
    return res.json({ message: "User not found" });
  }

  // const exercises = JSON.parse(JSON.stringify(user[0].logs))
  const exercises = user.map(obj => {
    return obj.exercises
  })

  const count = exercises.length
  exercises.forEach(exercise => {
    exercise.date = new Date(exercise.date).toDateString()
    delete exercise._id
  })

  res.json({ username: user[0].username, count: count, _id: id, log: exercises})
})

// API Endpoint for deleting users
app.delete('/api', async function (req, res) {
  await User.deleteMany()
  res.json({msg:'Deleted Users'})
})

const start = async () => {
  try {
    console.log('Connecting to DB...')
    await connectDB(process.env.MONGO_URI)
    console.log('Connected to DB...')
    app.listen(process.env.PORT || 3000, (port) => {
      console.log('Your app is listening on port ' + process.env.PORT || 3000)
    })
  } catch (error) {
    console.log(error)
  }  
}

start()