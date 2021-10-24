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
  .populate('user_id')
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
  .populate('user_id')
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
      
    //set user id so curr user's reviews can be deleted
    let tmp_user = "none";
    if(req.session.user)
    {
      tmp_user = req.session.user._id;
    }
    //handle item found
    resp.render('shop/product-detail',
    { item: item,
      reviews: reviews,
      page_title: "Details for " + item.title,
      path: "/products",
      curr_user_id: tmp_user
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


  let review = new Review({
    rating: user_rating,
    review: user_review,
    product_id: item_id,
    user_id: user_id
  });
  review.save()
  .then(result => {
    //update product with all reviews
    Product.findById(item_id)
    .then(item => {
      //get all reviews for the item
      Review.find({'product_id' : item_id})
      .then(reviews => {
        let rating = 0;
        let num_revs = reviews.length;
        //check revies found so don't divide by zero
        if(num_revs <= 0)
        {
          throw new Error ("Error saving review: no reviews were found after save.");
        }
        //add up all reviews
        for(let review of reviews)
        {
          rating += review.rating;
        }
        //now divide by num revs to get ave
        rating /= num_revs;
        //now update product
        item.rating = Math.round(rating);
        item.save()
        .then(result => {
          resp.redirect('/products/' + item_id);
         })
        .catch(err => {
            throw new Error ("Error saving new rating for " + item_id + ": " + err);
        });//END SAVE ITEM RATING


      })
      .catch(err => {
          throw new Error ("Error finding reviews to update product rating for " + item_id + ": " + err);
      });//END FIND ALL REVIEWS
    })
    .catch(err => {
        throw new Error ("Error updating product rating for " + item_id + ": " + err);
    });//END FIND PRODUCT TO UPDATE


  })
  .catch(err => {
    console.log("Error saving review: " + err)
  });
};//END POST USER"S REIVEW

//delete a user's review
exports.post_del_review = (req, resp, next) => {
  //get review and id
  let review_id = req.body.review_id;
  let return_item_page = req.params.item_id;
  //get review in question;
  Review.findById(review_id)
  .then(review => {
    //check that review's id matches current users id
    if(!req.session.user)
    {
      throw new Error("No user signed in");
    }

    let tmp_user_id = req.session.user._id;
    if(tmp_user_id.toString() !== review.user_id.toString())
    {
      throw new Error ("User is not authorized to delete this review");
    }
    //if here review can be deleted
    Review.findByIdAndRemove(review_id)
    .then(result => {
      let item_id = return_item_page;

      //recalc the item rating:
      Product.findById(item_id)
      .then(item => {
        //get all reviews for the item
        Review.find({'product_id' : item_id})
        .then(reviews => {
          let rating = 0;
          let num_revs = reviews.length;
          //check revies found so don't divide by zero
          if(num_revs <= 0)
          {
            //no reviews, no need to recalc
            return resp.redirect('/products/' + return_item_page);
          }
          //add up all reviews
          for(let review of reviews)
          {
            rating += review.rating;
          }
          //now divide by num revs to get ave
          rating /= num_revs;
          //now update product
          item.rating = Math.round(rating);
          item.save()
          .then(result => {
            //redirect back to the item page:
            return resp.redirect('/products/' + return_item_page);
           })
          .catch(err => {
              throw new Error ("Error saving new rating for " + item_id + ": " + err);
          });//END SAVE ITEM RATING
        })
        .catch(err => {
            throw new Error ("Error finding reviews to update product rating for " + item_id + ": " + err);
        });//END FIND ALL REVIEWS
      })
      .catch(err => {
          throw new Error ("Error updating product rating for " + item_id + ": " + err);
      });//END FIND PRODUCT TO UPDATE
      
    })//END REMOVE ID
    .catch(err => {
      throw new Error("Error when trying to delete review: " + err);
    })
  })
  .catch(err => {
    console.log(err);
    resp.render('errors/500', {
      path: '/500',
      page_title: 'Error 500'
    });
  })
};



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
    //first check product is in stock
    if(product.stock <= 0)
    {
      req.flash('err', "Sorry, that product is out of stock.");
      console.log("Warning! Product out of stock!")
      return null;
    }

    //item in stock, make sure to subtract from item stock
    product.stock -= 1;
    product.save();

    return req.user.add_to_cart(product);
  })
  .then(result => {
    console.log(result);
    resp.redirect('/cart');
  })
  .catch(err => {
    console.log("Error saving product: " + err);
    resp.redirect('/500');
  });  

};//END POST CART FUNC

exports.post_cart_del_item = (req, resp, next) => {
  //extract given product id
  const product_id = req.body.item_id;
  //get quantity of item in cart
  
  let tmp_item = req.user.cart.items.filter(cart_item => cart_item.product_id.toString() === product_id.toString())
  let tmp_qnty = tmp_item[0].qnty;

  req.user
  .del_from_cart(product_id)
  .then(result => {
    //item deleted from cart, now restor stock
    //first get the item
    Product.findOne({_id: product_id})
    .then(item => {
      //restor qnty to stock
      item.stock += Number(tmp_qnty);
      //save 
      item.save()
      .then(result => {
        //redirect to cart
        resp.redirect('/cart');
      })
      .catch(err => {
        throw new Error("Error finding product " + product_id + " to restore stock: " + err);
      });
    })
    .catch(err => {
      throw new Error("Error finding product " + product_id + " to restore stock: " + err);
    });
  })
  .catch(err => {
    console.log(err);
    resp.redirect('/500');
  } );

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
