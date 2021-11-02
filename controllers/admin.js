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

  let tmp_img = req.files === undefined ? '/imgs/default.png' : req.files;
  let other_imgs = [];
  if(tmp_img !== '/imgs/default.png')
  {
    for(file of tmp_img)
    {
      other_imgs.push( ("/imgs/" + file.filename) );
    }
  }
  else
  {
    other_imgs.push(tmp_img);
  }

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
        img: tmp_img,
        desc: req.body.item_desc,
        stock: req.body.item_stock},
        page_title: 'Edit A Product',
        path: '/admin/edit-product',
        edit_mode: false,
        add_mode: true,
        err_msg: err_arr,
        input_err_ids: input_err_ids});
  }//END IF ARE V_ERRS


  const product = new Product( {title: req.body.title,
                               price: req.body.item_price,
                               img_link: ('/imgs/' + tmp_img[0].filename),
                               other_imgs: other_imgs,
                               desc: req.body.item_desc,
                               stock: req.body.item_stock,
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
  let tmp_img = req.files === undefined ? '/imgs/default.png' : req.files;
  let other_imgs = [];
  if(tmp_img !== '/imgs/default.png')
  {
    for(file of tmp_img)
    {
      other_imgs.push( ("/imgs/" + file.filename) );
    }
  }
  else
  {
    other_imgs.push(tmp_img);
  }

  //get new fields
  const item_id = req.body.item_id;
  const item_title = req.body.title;
  const item_img = req.files;
  const item_price = req.body.item_price;
  const item_desc = req.body.item_desc;
  const item_stock = req.body.item_stock;
  const change_img = req.body.option_new_cover_img;
  const new_img_index = req.body.new_cover_img_index;

  console.log(change_img);
  console.log(new_img_index);

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
        //img: item_img,
        desc: req.body.item_desc,
        stock: req.body.item_stock,
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

    //check if cover img changed:
    let tmp_index = Number(new_img_index)
    if (change_img && !isNaN(tmp_index))
    {
      let new_cover_img = product.other_imgs[tmp_index];
      product.img_link = new_cover_img;
      console.log("POO IS HCAHKLHJKLDF");
    }



    product.title = item_title;
    product.price = item_price;
    product.desc = item_desc;
    product.stock = item_stock;

    //update if items added
    if(item_img !== undefined)
    {
      for(img of other_imgs){
        product.other_imgs.push(img);
      }
    }


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
