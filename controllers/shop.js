const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Review = require('../models/reviews');
const escapeText = require('../util/util.js');



/************************************************************
 * SHOP ROUTES
 * ***********************************************************/

//Display product list/allow user add to cart/etc
 exports.get_products = (req, resp, next) => {
   //mongoose method to replace our old fetch_all() method
  Product.find()
  .then( (product_arr) => {
    resp.render('shop/product-list',
      { products: product_arr,
        page_title: 'All Products',
        path: '/products'
        });//w/cust root dir path
  })
  .catch(err => {console.log(err);});//end fetch_all()
};


exports.get_item_details = (req, resp, next) => {
  //get the product id from url var (fetched with .get(filter/:var))
  const item_id = req.params.item_id;

  Product.findById(item_id)
  .then( (item) => {
    //check for error/handle
    if(item === null)
    {
      req.flash('err', 'Sorry we couldn\'t find that product.')
      console.log("Failed to get item: " + item_id + "for detail display.");
      //go to error page
      resp.redirect('/');
      return;
    }

    //Item has been found, now get reviews for the item
    Review.find({'product_id' : item_id})
    .populate('user_id')
    .then(reviews => {

      //check for null user (eg if user has been deleted/etc)
      for(let i = 0; i < reviews.length; i++)
      {
        if(reviews[i].user_id == null)
        {
          //add in a default user
          reviews[i].user_id = new User({
            username: "User Not Found",
            email: "none",
            user_img: '/imgs/user_img.png',
            password: "none",
            cart: {items: []}
          });//end create new user
        }//END IF USER NULL
      }//END FOR EACH REVIEW
      
    //handle item found
    resp.render('shop/product-detail',
    { item: item,
      reviews: reviews,
      page_title: "Details for " + item.title,
      path: "/products"
    });

    })
    .catch(err => console.log(err));//END GET REVIES

  }).catch(err => {console.log(err)});//END GET ITEM INFO
};//END GET ITEM DETAILS


//GET PRODUCT DETAILS FOR USER REVIEW
exports.get_product_review = (req, resp, next) => {
  //get the product id from url var (fetched with .get(filter/:var))
  const item_id = req.params.item_id;

  Product.findById(item_id)
  .then( (item) => {
    //check for error/handle
    if(item === null)
    {
      console.log("Failed to get item: " + item_id + "for detail display.");
      //go to error page
      resp.redirect('/');
      return;
    }
    
    //handle item found
    resp.render('shop/product-review',
      {item: item,
      page_title: "Details for " + item.title,
      path: "/products"});
  }).catch(err => {console.log(err)})
};//END GET PRODUCT REVIEW


//POST USER"S REVIEW 
exports.post_product_review = (req, resp, next) => {
  //get product id and review info
  let item_id = req.body.item_id;
  let user_review = escapeText(req.body.user_review);
  let user_rating = Number(req.body.item_rating);
  let user_id = req.user._id;

  console.log("POST REVIEW: " + user_review);

  let review = new Review({
    rating: user_rating,
    review: user_review,
    product_id: item_id,
    user_id: user_id
  });
  review.save()
  .then(result => {
    resp.redirect('/products/' + item_id);
  })
  .catch(err => {
    console.log("Error saving review: " + err)
  });

  //dvdvdvdvdv test see if works
  //need to redirect back to products page after review saved
  //need to write getting funcs into get product review info/etc
};//END POST USER"S REIVEW

//Cart
exports.get_cart = (req, resp, next) => {
req.user
.populate('cart.items.product_id')
.then(user => {
    resp.render('shop/cart',
      { page_title: 'Shop',
        path: '/cart',
        items: user.cart.items
        });//w/cust root dir path
})
.catch(err => console.log(err));

};

//add item to Cart
exports.post_cart = (req, resp, next) => {

  const item_id = req.body.item_id;
  Product.findById(item_id)
  .then(product => {
    return req.user.add_to_cart(product);
  })
  .then(result => {
    console.log(result);
    resp.redirect('/cart');
  });  

};//END POST CART FUNC

exports.post_cart_del_item = (req, resp, next) => {
  //extract given product id
  const product_id = req.body.item_id;

  req.user
  .del_from_cart(product_id)
  .then(result => {
    resp.redirect('/cart');
  })
  .catch(err => console.log(err));

};//END POST_CART_DEL_ITEM

//orders
exports.get_orders = (req, resp, next) => {
  Order.find({'user.user_id': req.user._id})
  .then(orders => {
    resp.render('shop/orders',
    { page_title: 'Your Orders',
      path: '/orders',
      orders: orders
      });//w/cust root dir path
   })
  .catch(err => console.log(err));

};

exports.post_order = (req, resp, next) => {
  //
  req.user
  .populate('cart.items.product_id')
  .then(user => {
    const products = user.cart.items.map(i => {
      return { qnty: i.qnty, product_data: {...i.product_id._doc} }
    });
    
    //calc total
    let tmp_total = 0.00;
    for(let i = 0; i < products.length; i++)
    {
      tmp_total += Number(products[i].product_data.price)
                 * Number(products[i].qnty)
    }

    const order = new Order({
    user: {
      user_name: req.user.username,
      user_id: req.user
    },
    order_total: tmp_total,
    products: products
    });
    return order.save();
  })
  .then(result => {
    //clear the cart
    req.user.clear_cart();
  })
  .then(result => {
    resp.redirect('/orders');
  })
  .catch(err => console.log(err));
};

  //checkout
  exports.get_checkout = (req, resp, next) => {
    Product.fetchAll().then( product_arr => {
      resp.render('shop/checkout',
        { products: product_arr,
          page_title: 'Checkout',
          path: '/checkout'
          });
    }).catch(err => {console.log(err);});//end fetchAll()
};

//get shop index
exports.get_index = (req, resp, next) =>{
  //use sequelize func to get all rows/etc
  Product.find()
  .then( product_arr => {
    //
    resp.render('shop/index',
      { products: product_arr,
        page_title: 'Shop',
        path: '/',
        //E.g.->passing csrfToken to indivitual page:
        //csrf_token: req.csrfToken()
        });
  }).catch(err => {console.log(err);});
};
