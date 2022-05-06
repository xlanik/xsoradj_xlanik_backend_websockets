const mongoose = require('mongoose')

const schemaCars = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  technician_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  oilChange: {
    type: Boolean,
    required: true
  },
  filterChange: {
    type: Boolean,
    required: true
  },
  tireChange: {
    type: Boolean,
    required: true
  },
  engineService: {
    type: Boolean,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image_url: {
    type: String,
    required: true
  },
  number_plate: {
    type: String,
    required: true
  },

})

module.exports = mongoose.model('Cars', schemaCars)