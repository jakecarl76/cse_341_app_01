module.exports = (req, resp, next) => {
    //check if user is logged
    if(!req.session.user)
    {
      //if no user set, not logged in, redirect to login
      return resp.redirect('/login');
    }
    next();
};