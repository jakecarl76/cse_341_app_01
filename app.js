//const http = require('http');//no longer needed with express js
//const db_conn = require('./util/no_sql_db');//don't need with mongoose
const mongoose = require('mongoose');

//import cors
const cors = require('cors');

//import csrf protection
const csrf = require('csurf');

//import connect-flash (for err msg's for redirects/etc)
const flash_mod = require('connect-flash');

//create/setup session using 3rdparty package
const sess = require('express-session');
const sess_mongodb = require('connect-mongodb-session')(sess);

const port = process.env.PORT || 3000;//so can run on heroku or port 3000

const path_mod = require('path');
const err_pages = require('./controllers/error');

const User = require('./models/user');


//setup session storage
const sess_db = new sess_mongodb({
  uri: process.env.MONGODB_URL || "mongodb+srv://rw_user_01:69bBjqNkcnuJNPz1@cluster0.5xj1t.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  collection: 'srvr_sessions'
});

//init csurf/csrf protection
const csrf_middleware = csrf();


//import express into doc
const express = require('express');
//import parser
const bodyParser_mod = require('body-parser');

//import custome middleware routing functions
const admin_router = require('./routes/admin');
const shop_routes = require('./routes/shop');
const auth_routes = require('./routes/auth');


//create an express object
const app_obj = express();

//set the view/templating engine
app_obj.set('view engine', 'ejs');
//set the views folder (default is views so this is redundant.)
app_obj.set('views', 'views');
 

//set up to use body parser to parse the incoming request
  //object passed to it is its config options --> if it should
  //be able to parse non-default features
app_obj.use(bodyParser_mod.urlencoded({extended: false}));
//express module .static(path_str) --> allows clients to access given path
  //w\out needing an app_obj.use() to grant specific access/serve it
app_obj.use(express.static(path_mod.join(__dirname, 'public')));

//set up sessions:
app_obj.use(sess({
  secret: 'long secret text str',
  resave: false, //ie only save when something changes
  saveUninitialized: false,
  //cookie: {maxAge:...} //can also set up the cookie here
  store: sess_db
}));

//init connect-flash
//needs to be done after init session (uses session)
app_obj.use(flash_mod());

//set to use csrf middleware protection
app_obj.use(csrf_middleware);

//set up user if is one:
app_obj.use((req, resp, next) => {
  //check if user
  if(!req.session.user)
  {
    return next();
  }
  User.findById(req.session.user._id)
  .then(user => {
    //double check user exists
    if(!user)
    {
      return next();
    }

    req.user = user;
    next();
  })
  .catch( err => {
    throw new Error(err);
  });
});

//CSRF tokens and other info
app_obj.use( (req, resp, next) => {
  //add general vars to every resp. obj via the resp.locals property:
  resp.locals.is_logged_in = req.session.is_logged_in;
  resp.locals.err_msg = req.flash('err');
  resp.locals.csrf_token = req.csrfToken();
  next();
});

//set up to use routes
app_obj.use('/admin', admin_router.routes);
app_obj.use(shop_routes);
app_obj.use(auth_routes);

//add an error 500 catcher
app_obj.use('/500', err_pages.err_500);


//add an error 404 catcher
app_obj.use(err_pages.err_404);

//Special error handling middleware:
//catches all errors passed by other middlewares to their next() func
//ie-> next(err_obj);
app.use((err, req, resp, next) => {
  resp.redirect('/500');
});

//SET UP CORS:
const corsOptions = {
  origin: "https://cse-341-app-01.herokuapp.com/",
  optionsSuccessStatus:200
};

app_obj.use(cors(corsOptions));

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  family:4
};

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://rw_user_01:69bBjqNkcnuJNPz1@cluster0.5xj1t.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

//MONGOOSE SETUP:
mongoose.connect(MONGODB_URL)
.then(result => {
  app_obj.listen(port, () => {console.log("this app is listening on port# " + port)});
})
.catch(err => console.log(err));

