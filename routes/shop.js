const path_mod = require('path');

const express_mod = require('express');

const is_auth = require('../middleware/is-auth');

const router = express_mod.Router();

const root_dir = require('../util/path');

const admin_routes = require('./admin');

const shop_ctrl = require('../controllers/shop');

router.get('/products', shop_ctrl.get_products);

router.get('/products/:item_id', shop_ctrl.get_item_details);

router.get('/product/review/:item_id', is_auth, shop_ctrl.get_product_review);

router.post('/product/post-review', is_auth, shop_ctrl.post_product_review);

router.get('/cart', is_auth, shop_ctrl.get_cart);

router.post('/cart', is_auth, shop_ctrl.post_cart);

router.post('/cart-delete-item', is_auth, shop_ctrl.post_cart_del_item)

router.get('/orders', is_auth, shop_ctrl.get_orders);

router.post('/create-order', is_auth, shop_ctrl.post_order);

// router.get('/check-out', shop_ctrl.get_checkout);

router.get( '/', shop_ctrl.get_index);

module.exports = router;