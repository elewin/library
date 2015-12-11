var passport = require('passport'); //for OAuth

//this controller handles OAuth via passport

module.exports = {
  getProfile: function(req, res){
    if(!req.isAuthenticated()){
      res.status(401).send('Unauthorized');
    }else{
      res.status(200).send(req.user);
    }
  },

  authenticate: passport.authenticate('facebook'),

  callback: passport.authenticate('facebook',{
    successRedirect: '/api/auth/fb/profile',
    failureRedirect: '/api/auth/fb',
  }),

};
