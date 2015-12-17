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

  //deprecated, findUserAndLogin should add users automatically
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

  //when a user logs in, search to see if their facebook id is already in the user database. if so, login as that user. if not, create a new user and library for them. Returns a promise.
  findUserAndLogin : function(token, profile){ //add refreshToken later if its needed
    return q.Promise(function(resolve, reject){
      console.log('searching for', profile.id);
      User.findOne({'fb.id' : profile.id}).exec()
      .then(function(user){

        //if this facebook user id is not found in the user database, make a new user with it:
        if(!user){
          console.log('making new user', profile.displayName, 'id:', profile.id);
          newUser = new User({
            name: profile.displayName,
            fb: {
              id: profile.id,
              token: token,
            },
          });
          //create a library for this user and then save it
          newUser.library = new Library();
          newUser.library.ownerId = newUser.id;
          newUser.library.ownerFbId = newUser.fb.id;
          newUser.library.save();

          //save the user
          newUser.save().then(function(){
            resolve(newUser); //this is what the promise will return
          });
        }
        else{ //if we found the user:
          console.log('found user', user.name, 'id:', user.fb.id, user._id);
          //check if we need to update the token, and if so update it:
          if (token !== user.fb.token){
            User.update({_id: user._id}, {
              fb: {
                id: user.fb.id,
                token: token,
              }
            }).then(function(){
              resolve(user);
            });
          }
          else { //the token is good
            resolve(user);
          }
        }
      }).catch(function(err) {
        console.log('findUserAndLogin error:', err);
        reject(user);
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
