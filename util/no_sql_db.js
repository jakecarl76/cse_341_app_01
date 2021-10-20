//import mongodb pkg
const mongodb_mod = require('mongodb');
//extract mongo client constructor
const mongo_client = mongodb_mod.MongoClient;

//create a var to hold db connection
let _db_conn;

const mongodb_connect = (cb_func) => {
  //connect to mongo db via client
  //takes url given by the mongo db cloud server
  //remember to replace "<pasword>" with user's password.
  //eg. originial url: 
  //mongodb+srv://rw_user_01:<password>@cluster0.5xj1t.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
  mongo_client.connect("mongodb+srv://rw_user_01:69bBjqNkcnuJNPz1@cluster0.5xj1t.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
  .then(client => {
    console.log('successfully connected to mongoDB');
    //successful connection, run given call back and save mongoDB client
    //note, can override the db that is connected to in the given url via:
    //client.db('diff_db_name');
    _db_conn = client.db();
    cb_func();
  })
  .catch(err => {
    console.log(err);
    throw err;
  });
};

//create func to get reff to db connection
const get_db_conn = () => {
  if(_db_conn)
  {
    return _db_conn;
  }
  throw 'Database is still undefined!';
};


exports.get_db_conn = get_db_conn;
exports.mongodb_connect = mongodb_connect;