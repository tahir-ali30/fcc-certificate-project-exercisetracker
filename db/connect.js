const mongoose = require('mongoose')

function connectDB(url) {
    return mongoose.connect(url).then(console.log('Connected to DB...'))
}

module.exports = connectDB