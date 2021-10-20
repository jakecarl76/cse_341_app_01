const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const order_schema = new Schema({
  products: [{
    product_data: { type: Object, required: true},
    qnty: {type: Number, required: true}

  }],
  order_date: { type: Date, default: Date.now},
  order_total: {type: Number, required: true},
  user: {
    user_name: {
      type: String,
      required: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }
});

module.exports = mongoose.model('Order', order_schema);