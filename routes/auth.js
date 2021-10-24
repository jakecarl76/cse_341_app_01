const express = require('express');
const auth_ctrl = require('../controllers/auth');
const is_auth = require('../middleware/is-auth');

//import express validator's 'check' pkg
//const exp_vldr = require('express-validator/check');
//can also import it this way:
const { check, body } = require('express-validator/check');

//create router from express.js
const router = express.Router();

const User = require('../models/user');

router.get('/login', auth_ctrl.get_login);

router.post('/login',
             body('email')
             .isEmail()
             .withMessage('Email invalid. Please enter the email for your account, or sign up to start an account.')
             .normalizeEmail(),
             body('pword', 'Invalid email or password.')
             .notEmpty(),
             auth_ctrl.post_login);

router.post('/logout', auth_ctrl.post_logout);

//go through check mid. ware for validation first
//validation works check('form_field_name').validationCheckFunc()
router.get('/signup', auth_ctrl.get_signup);

router.post('/signup', check('email')
                      .isEmail()
                      .withMessage('Email is invalid. Please enter a valid email.')
                      .normalizeEmail(),
                      check('uname')
                      .custom( (value, {req}) => {
                        if(value.toLowerCase() === 'admin')
                        {
                          throw new Error ('You cannot use "admin" as a user name.');
                        }
                        return true;
                      }), 
                      body('pword', 'Invalid password. Please choose another password.')
                      .isLength({min: 10})
                      .withMessage('Password is too short. Must be at least 10 characters long.')
                      .custom( (value, {req}) => {
                        if(value === 'password' || value === '1234567890')
                        {
                          return false;
                        }
                        return true;
                      })
                      .custom( (value, {req}) => {
                        if(value !== req.body.c_pword)
                        {
                          throw new Error('Sorry, Password and Confirm Password do not match. Please try again.');
                        }
                        return true;
                      }),
                      body('uname')
                      .custom( (value, {req}) => {
                        return User.findOne( {username: value})
                        .then( user => {
                          //check for if user found (ie user name already used)
                          if (user)
                          { //asyncronous rejection for validation
                            return Promise.reject('Sorry, that user name is already taken.')
                          }
                        })
                      }),
                      auth_ctrl.post_signup);

router.get('/reset', auth_ctrl.get_reset);

router.post('/reset', auth_ctrl.post_reset);

router.get('/password-reset/:token', auth_ctrl.get_new_password);

router.post('/password-reset/', auth_ctrl.post_new_password);

router.get('/user-profile', is_auth, auth_ctrl.get_user_profile);


//add all changes for user profile
router.post('/user-profile/change-email', 
  body('email')
  .isEmail()
  .withMessage('Email invalid. Please enter the email for your account, or sign up to start an account.')
  .normalizeEmail(),
  is_auth, 
  auth_ctrl.post_change_email);

router.post('/user-profile/change-username', 
            is_auth, 
            check('uname')
            .custom( (value, {req}) => {
              if(value.toLowerCase() === 'admin')
              {
                throw new Error ('You cannot use "admin" as a user name.');
              }
              return true;
            }), 
            auth_ctrl.post_change_username);

router.post('/user-profile/change-img', 
            is_auth,
            auth_ctrl.post_change_user_image);

router.post('/user-profile/change-pwd',
            is_auth,
            body('pwd', 'Invalid password. Please choose another password.')
            .isLength({min: 10})
            .withMessage('Password is too short. Must be at least 10 characters long.')
            .custom( (value, {req}) => {
              if(value === 'password' || value === '1234567890')
              {
                return false;
              }
              return true;
            })
            .custom( (value, {req}) => {
              if(value !== req.body.c_pwd)
              {
                throw new Error('Sorry, Password and Confirm Password do not match. Please try again.');
              }
              return true;
            }),
            body('curr_pwd')
            .notEmpty()
            .withMessage('You must enter your current password to change it.'),
            auth_ctrl.post_change_user_password)

//export the router
module.exports = router;