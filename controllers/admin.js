const {validationResult} = require('express-validator/check');
const Product = require('../models/product');

/*************************************************************
* ADMIN ROUTES 
************************************************************** */

//export this function for the router to use its app.get/post function
exports.get_add_product = (req, resp, next) => {

  resp.render('admin/edit-product', {
    page_title: 'Add A New Product',
    path: '/admin/add-product',
    edit_mode: false,
    add_mode: false,
    input_err_ids: []});
}

exports.post_add_product = (req, resp, next) => {

  let tmp_img = req.body.img_link == '' ? '/imgs/default.png' : req.body.img_link;
  
 /* OLD VALIDATION
  //check all inputs:
  if(req.body.title === '')
  {
    req.flash('err', 'The product must be given a title');
  }
  if(Number(req.body.item_price) < 0 || isNaN(Number(req.body.item_price)))
  { console.log(req.body.item_price + " :ISNAN:  " + isNaN(Number(req.body.item_price)))
    req.flash('err', 'The product\'s price must be a positive number');
  }
  if(req.body.item_desc === '')
  {
    req.flash('err', 'The product must be given a description');
  }

  END OLD VALIDATION*/

  //check for validation errs
  const v_errs = validationResult(req);
  if(!v_errs.isEmpty())
  {
    //gen err msgs
    let err_arr = [];
    let input_err_ids = [];
    for(err of v_errs.array())
    {
      err_arr.push(err.msg);
      input_err_ids.push(err.param);
    }
    //if err, return, but make item obj, so user input not errased!
    return resp.render('admin/edit-product', 
      { item: {title: req.body.title,
        price: req.body.item_price,
        img_link: tmp_img,
        desc: req.body.item_desc,
        rating: req.body.item_rating},
        page_title: 'Edit A Product',
        path: '/admin/edit-product',
        edit_mode: false,
        add_mode: true,
        err_msg: err_arr,
        input_err_ids: input_err_ids});
  }//END IF ARE V_ERRS


  const product = new Product( {title: req.body.title,
                               price: req.body.item_price,
                               img_link: tmp_img,
                               desc: req.body.item_desc,
                               rating: req.body.item_rating,
                               user_id: req.user._id
  });

  //save method is defined by mongoose
  product.save()
  .then(result => {
    resp.redirect('/admin/products');
  })
  .catch(err => {
    console.log(err);
    resp.redirect('/admin/add-product');
  });

};


exports.get_edit_product = (req, resp, next) => {
  const item_id = req.params.item_id;

  Product.findById(item_id) //get all products that match id (from any user)
  .then(item => {
    //check for error
    if(!item)
    {
      throw new Error('Product Not Found: ' + item_id )
    }
    resp.render('admin/edit-product', 
      { item: item,
        page_title: 'Edit A Product',
        path: '/admin/edit-product',
        edit_mode: true,
        add_mode: false,
        input_err_ids: []});
  })
  .catch(err => {
    console.log(err);
    resp.redirect('/500');
  });
  
}

exports.post_edit_product = (req, resp, next) => {
  //get new fields
  const item_id = req.body.item_id;
  const item_title = req.body.title;
  const item_img = req.body.img_link;
  const item_price = req.body.item_price;
  const item_desc = req.body.item_desc;
  const item_rating = req.body.item_rating;

  //check for validation errs
  const v_errs = validationResult(req);
  if(!v_errs.isEmpty())
  {
    //gen err msgs
    let err_arr = [];
    let input_err_ids = [];
    for(err of v_errs.array())
    {
      err_arr.push(err.msg);
      input_err_ids.push(err.param);
    }
    //if err, return, but make item obj, so user input not errased!
    return resp.render('admin/edit-product', 
      { item: {title: req.body.title,
        price: req.body.item_price,
        img_link: item_img,
        desc: req.body.item_desc,
        rating: req.body.item_rating,
        _id: item_id},
        page_title: 'Edit A Product',
        path: '/admin/edit-product',
        edit_mode: true,
        add_mode: false,
        err_msg: err_arr,
        input_err_ids: input_err_ids});
  }//END IF ARE V_ERRS



  //fetch the product to update it:
  Product.findById(item_id)
  .then(product => {
    //check user has auth to edit this product
    if(product.user_id.toString() !== req.user._id.toString())
    {
      req.flash('err', 'You\'re not authorized to edit that product.')
      return null;
    }
    product.title = item_title;
    product.price = item_price;
    product.img_link = item_img;
    product.desc = item_desc;
    product.rating = item_rating;
    return product.save();
  })
  .then(result => {
    resp.redirect('/admin/products');
  })
  .catch(err => {
    //useing expressjs to handle err
    const error = new Error(err);
    //set to error status for err
    error.httpStatusCode = 500;
    //pass error to next middleware func
    return next(error);
  });

   
}//END POST EDIT PRODUCT

exports.post_del_product = (req, resp, next) => {
  console.log("deleting product: " + req.body.item_id)
  //get id
  let tmp_id = req.body.item_id;

  //delete the row (but only if curr user auth'ed)
  Product.deleteOne({_id: tmp_id, user_id: req.user._id} )
  .then(result => {
    resp.redirect('/admin/products');
  })
  .catch(err => {console.log(err);});

};//END POST DEL

exports.get_del_product = (req, resp, next) => {
  Product.find()
  .then( product_arr => {
    resp.render('shop/product-list', 
                { products: product_arr,
                  page_title: 'Edit Product List',
                  path: '/admin/shop'
                });
    });
};

exports.get_products = (req, resp, next) => {
  Product.find({user_id: req.user._id})
  .then( product_arr => {
    resp.render('admin/products',
      { products: product_arr,
        page_title: 'Admin Products',
        path: '/admin/products'
        });
  }).catch(err => { console.log(err);});//end findALl()
};