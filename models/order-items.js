const sequelize_class = require('sequelize');
const { models } = require('../util/sql_db');

const db_obj = require('../util/sql_db');

const OrderItem = db_obj.define('orderItem', {
  id: {
    type: sequelize_class.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  qnty: sequelize_class.INTEGER
});

module.exports = OrderItem;