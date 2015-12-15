var passport = require('passport'); //for OAuth

//this controller handles OAuth via passport

module.exports = {


  authenticate: passport.authenticate('facebook'),

  callback: passport.authenticate('facebook',{
    successRedirect: '/api/users/profile',
    //failureRedirect: '/api/auth/fb/login',
    failureRedirect: '/'
  }),

  logout : function(req, res){
    console.log('logging out');
    req.logout();
    
    return res.status(200).end();
  }

};
