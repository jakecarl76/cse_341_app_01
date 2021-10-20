const path_mod = require('path');

const express_mod = require('express');

const {body} = require('express-validator/check');

const root_dir = require('../util/path');

const admin_ctrl = require('../controllers/admin');

const is_auth = require('../middleware/is-auth');

//have express mod create a router object
const router = express_mod.Router();


//add request handling to router
//use function saved in separate file to handel the request
router.get( '/add-product', is_auth, admin_ctrl.get_add_product);
router.post('/add-product',
            body('title').trim()
            .notEmpty()
            .withMessage('The product must be given a title.'),
            body('item_price').isFloat()
            .withMessage("Please set the price to a decimal number."),
            body('item_desc').trim()
            .notEmpty()
            .withMessage('The product must be given a description.'),
            is_auth, admin_ctrl.post_add_product);

router.get( '/edit-product/:item_id', is_auth, admin_ctrl.get_edit_product);
router.post( '/edit-product',
            body('title').trim()
            .notEmpty()
            .withMessage('The product must be given a title.'),
            body('item_price').isFloat()
            .withMessage("Please set the price to a decimal number."),
            body('item_desc').trim()
            .notEmpty()
            .withMessage('The product must be given a description.'),
            is_auth, admin_ctrl.post_edit_product);

router.get( '/products', is_auth, admin_ctrl.get_products);


// // //delete selected object
router.post('/delete-product', is_auth, admin_ctrl.post_del_product);

// //admin view of shop to edit list
router.get( '/shop', is_auth, admin_ctrl.get_del_product);

//exports
module.exports.routes = router;