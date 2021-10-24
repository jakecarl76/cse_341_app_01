const mongoose = require('mongoose');
const schema = mongoose.Schema;


const user_schema = new schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  password_token: String,
  password_token_exp: Date,
  user_img: {
    type: String,
    required: true
  },
  cart: {
    items: [{ product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
              },
              qnty: {type: Number, required: true}}]
  }
});

user_schema.methods.add_to_cart = function(product) {
  
  const cart_product_index = this.cart.items.findIndex(cp => {
    return cp.product_id.toString() === product._id.toString();
  });
  
  let new_qnty = 1;
  const updated_cart_items = [...this.cart.items];

  if(cart_product_index >= 0)
  {
    //set new quantity
    new_qnty = this.cart.items[cart_product_index].qnty + 1;
    //update in cart items arr
    updated_cart_items[cart_product_index].qnty = new_qnty;
  }
  else
  {
    //new item, add new item to cart
    updated_cart_items.push({
      product_id: product._id,
        qnty: 1
    });
  }
  this.cart = {items: updated_cart_items};
  //save to db
  return this.save();
};
//END FUNC ADD TO CART

user_schema.methods.del_from_cart = function(product_id)
{ 
  //filter out items with matching id, ie only keep non matching
  const updated_cart_items = this.cart.items.filter(item => {
    return item.product_id.toString() !== product_id.toString();
  });

  this.cart.items = updated_cart_items;
  return this.save();
};

user_schema.methods.clear_cart = function()
{
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', user_schema);


// const mongodb_mod = require('mongodb');
// const get_db_conn = require('../util/no_sql_db').get_db_conn;

// class User {
//   constructor(new_username, new_email, new_cart, new_id)
//   {
//     this.username = new_username;
//     this.email = new_email
//     this.cart = new_cart;
//     this._id = new_id;
//   }//END CONSTRUCTOR

//   save()
//   {
//     const db_conn = get_db_conn();
//     //if first time for collections to call a 'table' or 
//     //collection, will auto create it
//     return db_conn.collection('users').insertOne(this);
//   }//END SAVE FUNC

//   add_to_cart(product)
//   {
//     const cart_product_index = this.cart.items.findIndex(cp => {
//       return cp.product_id.toString() === product._id.toString();
//     });
    
//     let new_qnty = 1;
//     const updated_cart_items = [...this.cart.items];

//     if(cart_product_index >= 0)
//     {
//       //set new quantity
//       new_qnty = this.cart.items[cart_product_index].qnty + 1;
//       //update in cart items arr
//       updated_cart_items[cart_product_index].qnty = new_qnty;
//     }
//     else
//     {
//       //new item, add new item to cart
//       updated_cart_items.push({
//         product_id: new mongodb_mod.ObjectId(product._id),
//          qnty: 1
//       });
//     }

//     const updated_cart = {items: updated_cart_items};
//     const db_conn = get_db_conn();
//     return db_conn.collection('users')
//     .updateOne(
//       {_id: new mongodb_mod.ObjectId(this._id)},
//       {$set: {cart: updated_cart}}
//     );//end update one
//   }//END ADD TO CART FUNC

//   get_cart()
//   {
//     const db_conn = get_db_conn();

//     //create arr of product id's via maping just it to the new arr
//     const product_ids = this.cart.items.map(item => { return item.product_id});

//     //use special mongoDB $in operator to tell filter to search for everything
//     //in its given arr (product_ids)
//     return db_conn.collection('products')
//     .find({_id: {$in: product_ids }})
//     .toArray()
//     .then(products => {
//       //remap qantitys to products in new array
//       return products.map(p => {
//         //create new obj from p (each product) via spread operator
//         //give this new obj a qnty property and fill it via
//         //.find function to search for quanity in the cart.items objs
//         return {...p, qnty: this.cart.items.find(i => {
//           return i.product_id.toString() === p._id.toString();
//         }).qnty
//       }//end return new/spread product obj
//       });//end map func
//     });
//   }//END GET CART FUNC

//   del_cart_item(product_id)
//   {
//     //filter out items with matching id, ie only keep non matching
//     const updated_cart_items = this.cart.items.filter(item => {
//       return item.product_id.toString() !== product_id.toString();
//     });

//     //update cart
//     const db_conn = get_db_conn();
//     return db_conn
//     .collection('users')
//     .updateOne(
//       {_id: new mongodb_mod.ObjectId(this._id)},
//       {$set: {cart: { items: updated_cart_items} }}
//     );//end update

//   }//END DEL_CART_ITEM

//   get_orders()
//   {
//     const db_conn = get_db_conn();
//     return db_conn.collection('orders')
//     .find({'user._id': new mongodb_mod.ObjectId(this._id)})
//     .toArray();
//   }//END GET ORDERS

//   add_order()
//   {
//     const db_conn = get_db_conn();

//     //"enrich" the cart data
//     return this.get_cart()
//     .then(products => {
//       //create order item
//     const tmp_order = {
//       items: products,
//       user: {
//         _id: new mongodb_mod.ObjectId(this._id), 
//         username: this.username,
//       }
//     };
//     //insert new "enriched" cart
//     return db_conn.collection('orders')
//     .insertOne(tmp_order)
//     })
//     .then(result => {
//       //clean up local and db carts:
//       //set cart to empty in js obj
//       this.cart = {items: []};
//       //update db
//       return db_conn
//       .collection('users')
//       .updateOne(
//         {_id: new mongodb_mod.ObjectId(this._id)},
//         {$set: {cart: { items: []} }}
//       );//end update db
//     });
//   }

//   static find_by_id(user_id)
//   {
//     //convert str id to obj id
//     let tmp_id = new mongodb_mod.ObjectId(user_id);
//     const db_conn = get_db_conn();
//     //remember that find() returns a cursor, not the/an object->need to do .next()
//     return db_conn.collection('users').findOne({_id: tmp_id});
//   }
// }//END USER CLASS

//   module.exports = User;