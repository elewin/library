var passport = require('passport'); //for OAuth

//this controller handles OAuth via passport

module.exports = {


  authenticate: passport.authenticate('facebook'),

  callback: passport.authenticate('facebook',{
    successRedirect: '/',
    //failureRedirect: '/api/auth/fb/login',
    failureRedirect: '/'
  }),

  logout : function(req, res){
    req.logout();
    console.log('user logged out');
    return res.status(200).end();
  }

};
