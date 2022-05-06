const mongoose = require('mongoose')

const schemaTechnicians = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
})

module.exports = mongoose.model('Technicians', schemaTechnicians)