const crypto_lib = require('crypto'); //node js crypto library
const bcrypt = require('bcryptjs'); //3rd party pkg

//import email pkgs
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const sendmail_api_key = process.env.MAIL_KEY || require('../../hidden/app_01/mail_key').mail_key

//import part of validation pkg for checking for errors
const { validationResult } = require('express-validator/check')

const User = require('../models/user');

console.log("MAIL_KEY: " + sendmail_api_key);

//set up email
//creating sendgrid() obj creates a config for nodemailer to use to create the transport
const transporter = nodemailer.createTransport(sendgrid({
  //api_user: , //don't need since using api_key
  auth: {
    api_key: sendmail_api_key
  }
}));

exports.get_login = (req, resp, next) => {
  //
  //extract cookie value:
  console.log(req.get('Cookie').split(';'));
  resp.render('auth/login', { page_title: 'Login',
    path: '/login',
    input_email: ''
  });
}

/* EX POST LOGIN COOKIES SESSION/ETC
exports.post_login = (req, resp, next) => {
  //store login status in cookie
  //resp.setHeader('Set-Cookie', 'key=val');

  //use sessions via express-session pkg
  req.session.my_key = "value";

  resp.redirect('/');
}
*/

//add the default user to the request obj
exports.post_login = (req, resp, next) => {
  //get login info
  const email = req.body.email;
  const pword = req.body.pword;
  //get login validation info
  const v_errs = validationResult(req);
  
  //check if validation errors
  if(!v_errs.isEmpty())
  {
    //are errors, end func exe
    return resp.status(422).render('auth/login', {
      page_title: 'Login',
      path: '/login',
      err_msg: [v_errs.array()[0].msg],
      input_email: req.body.email
    })
  }

  User.findOne({email: email})
  .then(user => { //user is a mongoose model with all mongoose funcs
    //check if user found
    if(!user)
    { 
      //use connect-flash to pass a temp err msg via session
      req.flash('err', 'Invalid email or password.');
      return resp.render('auth/login', { page_title: 'Login',
        path: '/login',
        input_email: req.body.email
      });
    }
    //check password
    return bcrypt.compare(pword, user.password)
    .then(hash_result => {
      //check result of hash
      if(hash_result)
      {
        //add a new field to the request obj
        //ie->attach the user mongoose obj to the request obj
        req.session.user = user;
        req.session.is_logged_in = true;
        //don't need to use req.session.save() -> automatically done
        //use req.session.save() at times where you need a promise that activates
        //after the sess has saved ->ie to be sure sess is done saving before moving on.
        return req.session.save( (err) => {
          console.log(err);
          resp.redirect('/');
        });//END SESS.SAVE
      }
      //else, bad pword/username redirct back to login again
      //use connect-flash to pass a temp err msg via session
      resp.render('auth/login', { page_title: 'Login',
        path: '/login',
        input_email: req.body.email,
        err_msg: ['Invalid email or password.']
      });

    }).catch(err => {
      console.log(err);
      resp.render('auth/login', { page_title: 'Login',
        path: '/login',
        input_email: req.body.email
      });
    });
  }) 
  .catch(err => {
    console.log(err);
  });//END FindById(userid)
};


//add the default user to the request obj
exports.post_logout = (req, resp, next) => {
  //destory current session
  req.session.destroy( (err) => {
    console.log(err);
    resp.redirect('/')
  });
};


exports.get_signup = (req, resp, next) => {
  resp.render('auth/signup', { page_title: 'Signup for Products!',
    path: '/signup',
    input_err_ids: [],
    email: "",
    uname: "",
    uimg: ""
  });
}

//add the default user to the request obj
exports.post_signup = (req, resp, next) => {
  let email = req.body.email;
  let username = req.body.uname;
  let pword = req.body.pword;
  let c_pword = req.body.c_pword;
  let img = req.body.uimg !== '' ? req.body.uimg : '/imgs/user_img.png';
  let input_err_ids = [];

  //extract the validation errs that were added to request obj by check() func
  const v_errs = validationResult(req);

  //check if are any validation errs
  if (!v_errs.isEmpty())
  {
    let err_arr = [];
    for(err of v_errs.array())
    {
      err_arr.push(err.msg);
      input_err_ids.push(err.param);
    }
    //status 422 means errors
    return resp.status(422).render('auth/signup', { page_title: 'Signup for Products!',
     path: '/signup',
     err_msg: err_arr,
     input_err_ids: input_err_ids,
     email: email,
     uname: username,
     uimg: img
    });
  }


  //check email not used yet:
  User.findOne({email: email})
  .then(user => {
    if(user)
    {
      //err, user already exists
      req.flash('err', 'Sorry, that email has already been used');
      return resp.redirect('/signup');
    }
/* No longer need, done in router validation
    //check passwords match
    if(pword !== c_pword)
    {
      req.flash('err', 'Confirm pasword does not match password.');
      return resp.redirect('/signup');
    }
*/
    //encrypt pword (async)
    return bcrypt.hash(pword, 12)
    .then(hashed_pword => {
      //create new user
      const new_user = new User({
        username: username,
        email: email,
        password: hashed_pword,
        user_img: img,
        cart: {items:[]}
      });
      return new_user.save();
    });
  })
  .then( result => {
    //send an email to new user with sendgrid
    
    transporter.sendMail({
      to: email, //"car08056@byui.edu",//email, //don't send to anyone else, just myself
      from: 'car08056@byui.edu',
      subject: 'Welcome to the Product Store!',
      html: '<h1>Welcome to the Product Shop! You\'ve successfully signed up!</h1>'
    })
    .then(result => {
      console.log("Maile sent: " + result);
    })
    .catch(err => console.log(err));
    

    //redirect to login
    resp.redirect('/login');
  })
  .catch(err => console.log(err));


};


exports.get_reset = (req, resp, next) => {
  resp.render('auth/reset', {
    page_title: "Password Reset",
    path: '/reset'
  });
};


exports.post_reset = (req, resp, next) => {
  //generate random bytes for password reset token
  crypto_lib.randomBytes(32, (err, buffer) => {
    //check for err
    if (err)
    {
      console.log(err);
      req.flash('err', "Sorry, something went wrong. Please try again.")
      return res.redirect('/reset');
    }
    const reset_token = buffer.toString('hex');

    //find user to store their reset token/set its exp time
    User.findOne({email: req.body.email})
    .then(user => {
      if(!user)
      {
      //redierect/msg user
      req.flash('err', "Please enter a vaild email.");
      resp.redirect('/reset');
      }

      //log token for grading:
      console.log("Reset token is: " + reset_token);

      //store user's token
      user.password_token = reset_token;
      user.password_token_exp = Date.now() + 3600000;//exp in one hour from now
      return user.save();
    })
    .then(result => {
      let host = "localhost:3000";
      transporter.sendMail({
        to: req.body.email, //"car08056@byui.edu",//email, //don't send to anyone else, just myself
        from: 'car08056@byui.edu',
        subject: 'Product Store Password Reset',
        html: `<h1> Your Account Has Requested A Password Reset </h1>
          <p>
            Click link to reset your password.
          </p>
          <a href="http://${host}/password-reset/${reset_token}">Reset Password</a>`
      })
      .then(result => {
        req.flash('msg', 'Email has been sent. Please check your email associated with this account to reset your password.')
        resp.redirect('/');
      })
      .catch(err => console.log(err));//end send email
    })//end result of user.save()
    .catch(err => {
      console.log(err);
    });
  });
};

exports.get_new_password = (req, resp, next) => {
  //extract token from url
  const token = req.params.token;
  //get matching user with matching token
  //also check that the token is still valid ($gt special operator for greater than)
  User.findOne({password_token: token, password_token_exp: {$gt: Date.now()}})
  .then(user => {
    resp.render('auth/password-reset', {
      page_title: "Set New Password",
      path: '/reset-password',
      user_id: user._id.toString(), 
      pwd_token: token
    });
  })
  .catch(err => {
    console.log(err);
    req.flash("Password reset link is not valid or expired.")
    return redirect('/');
  });

};

exports.post_new_password = (req, resp, next) => {
  //extract new password, uid, etc
  const new_pwd = req.body.pword;
  const c_new_pwd = req.body.c_pword;
  const user_id = req.body.user_id;
  //also get the token
  const pwd_token = req.body.pwd_token;
  //creat var to beable to access user in multiple cb_funcs
  let tmp_user = null;

  //check password and confirm password match
  if(new_pwd != c_new_pwd)
  {
    //redirect back
    req.flash('err', "Password and Confirm Password do not match.");
    return resp.redirect('/password-reset/' + pwd_token);
  }

  //find user
  User.findOne({password_token: pwd_token, password_token_exp: {$gt: Date.now()}, _id: user_id})
  .then(user => {
    //set user var so able to access in next cb_func
    tmp_user = user;
    //hash new password
    return bcrypt.hash(new_pwd, 12);
  })
  .then(hashed_pwd => {
    tmp_user.password = hashed_pwd;
    //clean up token stuff
    tmp_user.password_token = undefined;
    tmp_user.password_token_exp = undefined;
    tmp_user.save();
  })
  .then(result => {
    resp.redirect('/login');
  })
  .catch(err => {
    console.log(err);
    req.flash('err', "Sorry, an error occurred.");
    return resp.redirect('/');
  });
};



exports.get_user_profile = (req, resp, next) => {
  resp.render('auth/user_profile',
  {
    page_title: "My Profile",
    input_err_ids: [],
    path: '/user-profile',
    user_obj: req.session.user
  });
};

exports.post_change_email = (req, resp, next) => {
  //check for validation errs
  const v_errs = validationResult(req);

  if(!v_errs.isEmpty())
  { 
    let input_err_ids = [];
    let err_arr = [];
    for (err of v_errs.array())
    {
      err_arr.push(err.msg);
      input_err_ids.push(err.param);
    }

    //status 422 input errors
    return resp.status(422).render('auth/user_profile',
      {
        path: '/user_profile',
        page_title: 'User Profile',
        err_msg: err_arr,
        input_err_ids: input_err_ids,
        user_obj: req.session.user
      });
  }//END IF ARE ERRS
  
  //get email
  const input_email = req.body.email;

  //make sure email is unique, ie not used by someone else
  User.findOne({email: input_email})
  .then(user => {

    //if user, email already taken
    if(user)
    {
      return resp.render('auth/user_profile',
      {
        path: '/user-profile',
        page_title: 'User Profile',
        err_msg: ["Sorry, that email is already used by another account."],
        input_err_ids: ['email'],
        user_obj: req.session.user
      });
    }
    
    //find user to set users email to new email
    let tmp_email = req.session.user.email
    
    User.findOne({_id: req.session.user._id})
    .then(curr_user => {
      
      //check found user ok
      if(!curr_user)
      { 
        throw new Error("User not found!");
      }

      curr_user.email = input_email;
      curr_user.save()
      .then(result => {
        //update sess user
        req.session.user = curr_user;
        
        resp.render('auth/user_profile',
        {
          path: '/user-profile',
          page_title: 'User Profile',
          err_msg: [],
          msgs: ["Email successfully updated."],
          input_err_ids: [],
          user_obj: req.session.user
        });
      })
      .catch(err => {
        throw new Error("Error saving new email: " + err);
      });

    })
    .catch(err => {
      throw new Error("Error saving new email: " + err);
    });//END GET CURR USER

    
  })
  .catch(err => {
    console.log(err);
    resp.redirect('/500');
  });
  

};//END POST CHANGE EMAIL


exports.post_change_username = (req, resp, next) => {
  //check for validation errs
  const v_errs = validationResult(req);

  if(!v_errs.isEmpty())
  { 
    let input_err_ids = [];
    let err_arr = [];
    for (err of v_errs.array())
    {
      err_arr.push(err.msg);
      input_err_ids.push(err.param);
    }

    //status 422 input errors
    return resp.status(422).render('auth/user_profile',
      {
        path: '/user_profile',
        page_title: 'User Profile',
        err_msg: err_arr,
        input_err_ids: input_err_ids,
        user_obj: req.session.user
      });
  }//END IF ARE ERRS
  
  //get email
  const input_username = req.body.uname;

  //make sure username is unique, ie not used by someone else
  User.findOne({username: input_username})
  .then(user => {

    //if user, email already taken
    if(user)
    {
      return resp.render('auth/user_profile',
      {
        path: '/user-profile',
        page_title: 'User Profile',
        err_msg: ["Sorry, that username is already used by another account."],
        input_err_ids: ['uname'],
        user_obj: req.session.user
      });
    }
    
    //find user to set users username to new username
    User.findOne({_id: req.session.user._id})
    .then(curr_user => {
      
      //check found user ok
      if(!curr_user)
      { console.log(curr_user);
        throw new Error("User not found!");
      }

      curr_user.username = input_username;
      curr_user.save()
      .then(result => {
        //update sess user
        req.session.user = curr_user;
        
        resp.render('auth/user_profile',
        {
          path: '/user-profile',
          page_title: 'User Profile',
          err_msg: [],
          msgs: ["Username successfully updated."],
          input_err_ids: [],
          user_obj: req.session.user
        });
      })
      .catch(err => {
        throw new Error("Error saving new username: " + err);
      });

    })
    .catch(err => {
      throw new Error("Error saving new username: " + err);
    });//END GET CURR USER

    
  })
  .catch(err => {
    console.log(err);
    resp.redirect('/500');
  });
  

};//END POST CHANGE USERNAME


exports.post_change_user_image = (req, resp, next) => {
  
  //get Img url
  const input_url = req.body.uimg;

  //find user to set users username to new username
  User.findOne({_id: req.session.user._id})
  .then(curr_user => {
    
    //check found user ok
    if(!curr_user)
    { console.log(curr_user);
      throw new Error("User not found!");
    }

    curr_user.user_img = input_url;
    curr_user.save()
    .then(result => {
      //update sess user
      req.session.user = curr_user;
      
      resp.render('auth/user_profile',
      {
        path: '/user-profile',
        page_title: 'User Profile',
        err_msg: [],
        msgs: ["Profile Image successfully updated."],
        input_err_ids: [],
        user_obj: req.session.user
      });
    })
    .catch(err => {
      throw new Error("Error saving new user image URL: " + err);
    });

  })
  .catch(err => {
    console.log(err);
    resp.redirect('/500');
  });//END GET CURR USER


};//END POST CHANGE User IMAGE


exports.post_change_user_password = (req, resp, next) => {
  //check for validation errs
  const v_errs = validationResult(req);

  if(!v_errs.isEmpty())
  { 
    let input_err_ids = [];
    let err_arr = [];
    for (err of v_errs.array())
    {
      err_arr.push(err.msg);
      input_err_ids.push(err.param);
    }

    //status 422 input errors
    return resp.status(422).render('auth/user_profile',
      {
        path: '/user_profile',
        page_title: 'User Profile',
        err_msg: err_arr,
        input_err_ids: input_err_ids,
        user_obj: req.session.user
      });
  }//END IF ARE ERRS
  
  //get email
  const curr_pwd = req.body.curr_pwd;

  //check current password

  //getuser by id
  User.findById(req.session.user._id)
  .then(user => {

    //if user, email already taken
    if(!user)
    {
      throw new Error("Error: Can't find current session's user!");
    }
    
    //compare passwords
    bcrypt.compare(curr_pwd, user.password)
    .then(hash_res => {
      
      //password incorrect
      if(!hash_res)
      { 
        return resp.render('auth/user_profile',
        {
          path: '/user-profile',
          page_title: 'User Profile',
          err_msg: ["Password invalid."],
          input_err_ids: ['curr_pwd'],
          user_obj: req.session.user
        });
      }

      //save new pwd
      bcrypt.hash(req.body.pwd, 12)
      .then(hashed_pwd => {
        user.password = hashed_pwd;
      user.save()
      .then(result => {
        //update sess user
        req.session.user = user;
        
        resp.render('auth/user_profile',
        {
          path: '/user-profile',
          page_title: 'User Profile',
          err_msg: [],
          msgs: ["Password successfully updated."],
          input_err_ids: [],
          user_obj: req.session.user
        });
      })
      .catch(err => {
        throw new Error("Error saving new Password: " + err);
      });//END SAVE CURR USER
      })
      .catch(err => {
        throw new Error("Error saving new Password: " + err);
      });
      
    })
    .catch(err => {
      throw new Error("Error saving new username: " + err);
    });//END GET CURR USER

    
  })
  .catch(err => {
    console.log(err);
    resp.redirect('/500');
  });
  



};//END POST CHANGE USER PASSWORD

