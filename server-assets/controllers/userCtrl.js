var mongoose = require('mongoose');
var Library = require('../models/librarySchema');
var User = require('../models/userSchema');
var bookSchema = require('../models/bookSchema');
var Book = mongoose.model('Book', bookSchema);
var q = require('q'); //promises library

module.exports = {

  getCurrentUser: function(req, res, next){
    if(!req.isAuthenticated()){
      console.log('user profile: need to login');

      res.status(401).send('Unauthorized');
    }else{
      console.log('this is the currently logged in user');
      console.log (req.user);
      return res.json(req.user);
      //res.status(200).send(req.user);
      //next();
    }
  },

  getUsers: function(req, res){
    User.find(req.query).exec(function(err, result){
      if(err) {
        res.status(400).json(err);
      } else {
        res.json(result);
      }
    });
  },

  getUser: function(req, res){
    User.findById(req.params.id, function(err, theUser){
      if(err) {
        res.status(400).json(err);
      } else {
          var options = {
            path: 'library.books.book',
            model: 'Book'
          };
          Book.populate(theUser, options, function(err, user){
            if(err){
              res.status(400).json(err);
            } else {
              res.json(user);
            }
          });
      }
    });
  },

  addUser: function(req, res){
    var newUser = new User(req.body);
    newUser.library = new Library(); //instead of here
    newUser.library.save();
    newUser.save(function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        res.json(result);
        //new librarty push here for multiple libraries later intead of stuff at top (call sep function)
      }
    });
  },

  //when a user logs in, search to see if their facebook id is already in the user database. if so, login as that user. if not, create a new user for them. Returns a promise.
  loginFindUser : function(token, profile){ //add refreshToken later if its needed
    return q.Promise(function(resolve, reject){
      User.findOne({'fb.id' : profile.id}).exec()
      .then(function(user){
        // console.log('id:', profile.id);
        // console.log(user);

        //if this facebook user id is not found in the user database, make a new user with it:
        if(!user){
          console.log('making new user', profile.displayName, profile.id);
          newUser = new User({
            name: profile.displayName,
            fb: {
              id: profile.id,
              token: token,
            },
          });
          newUser.save().then(function(){
            resolve(newUser);
          });
        }
        else{
          console.log('found user', user.name, user.fb.id);
          //logic to check for token updates
          resolve(user);
        }
      });
    });
  },

  editUser: function(req, res){
    User.findByIdAndUpdate(req.params.id, req.body, function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        res.json(result);
      }
    });
  },

  deleteUser: function(req, res) {
    User.findByIdAndRemove(req.params.id, function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        res.json(result);
      }
    });
  },



};
