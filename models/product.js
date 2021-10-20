const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create new product schema
//tells mongoose the form or structure we want the data to have
//while mongodb is not need to have rigid structure, mongoose forces one on
//our data with this given schema
const product_schema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  desc: {
    type: String,
    required: true
  },
  img_link: {
    type: String,
    required: true
  },
  rating: Number,
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User', //ref to the other, user.js model we set up, tells what the obj.id points to
    required: true
  }
});


//this model connects our schema with a name
//this name can be use like a constructor where we import this module
//this also connects or uses this name (lowercase) to name the collection in the db
module.exports = mongoose.model('Product', product_schema);

// const mongodb_mod = require('mongodb');
// const get_db_conn = require('../util/no_sql_db').get_db_conn;

// class Product {
//   constructor(product_title,
//               new_price,
//               new_img,
//               new_desc,
//               new_rating,
//               new_user_id,
//               new_id
//               )
//   {
//     this.title = product_title;
//     this.img_link = new_img == '' ? '/imgs/default.png' : new_img;
//     this.price = new_price;
//     this.desc = new_desc;
//     this.rating = new_rating;
//     this.user_id = new_user_id;
//     this._id = new_id ? new mongodb_mod.ObjectId(this._id) : null;
//   }//END CONSTRUCTOR

//   //save product into mongoDB
//   save()
//   {
//     //access db
//     const db_conn = get_db_conn();
//     let query_action;
//     //check if id is set, if so, update existing product
//     if(this._id)
//     {
//       query_action = db_conn.collection('products')
//       .updateOne({_id: new mongodb_mod.ObjectId(this._id)},
//        {$set: this});
//     }
//     else
//     {
//       query_action = db_conn.collection('products').insertOne(this);
//     }
//     //connect to 'table' or collection
//     //if doesn't exist yet, will be created on first conn
//     return query_action
//     .then(result => {
//       console.log(result);
//     })
//     .catch(err => console.log(err));
//   }

//   static fetch_all()
//   {
//     const db_conn = get_db_conn();
//     return db_conn.collection('products')
//     .find()
//     .toArray()
//     .then(products => {
//       return products;
//     })
//     .catch(err => console.log(err));
//   }//END FETCH_ALL STATIC FUNC

//   static fetch_item(id)
//   {
//     const db_conn = get_db_conn();
//     //call find and pass a filter to return prod w/given id
//     //call .next() on the cursor .find() returns to pass only the item,
//     //and not the cursor
//     return db_conn.collection('products')
//     .find({_id: new mongodb_mod.ObjectId(id)})
//     .next()
//     .then(product => {
//       return product;
//     })
//     .catch(err => console.log(err));
//   }//END FETCH ITEM FUNC

//   static del_by_id(id)
//   {
//     const db_conn = get_db_conn();
//     return db_conn.collection('products')
//     .deleteOne({_id: new mongodb_mod.ObjectId(id)})
//     .then(result => {
//       console.log("object deleted")
//     })
//     .catch(err => console.log(err));
//   }//END DEL_BY_ID
// }//END PRODUCT CLASS
// module.exports = Product;