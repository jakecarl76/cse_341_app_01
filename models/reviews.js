const mongoose = require ('mongoose');

const Schema = mongoose.Schema;

const review_schema = new Schema({
  rating: {type: Number, required: true},
  review: {type: String, required: false},
  date: {type: Date, required: true, default: Date.now},
  product_id: {
    type: Schema.Types.ObjectId,
    ref:"Product",
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Review', review_schema);