var mongoose = require('mongoose');
var Library = require('../models/librarySchema');
var User = require('../models/userSchema');
var bookSchema = require('../models/bookSchema');
var Book = mongoose.model('Book', bookSchema);

module.exports = {
  getUsers: function(req, res){
    User.find(req.query).exec(function(err, result){
      if(err) {
        res.status(500).json(err);
      } else {
        res.json(result);
      };
    });
  },
  getUser: function(req, res){
    User.findById(req.params.id, function(err, theUser){
      if(err) {
        res.status(500).json(err);
      } else {
          var options = {
            path: 'library.books.book',
            model: 'Book'
          };
          Book.populate(theUser, options, function(err, user){
            if(err){
              res.status(500).json(err);
            } else {
              res.json(user);
            };
          });
      };
    })
  },
  addUser: function(req, res){
    var newUser = new User(req.body);
    newUser.library = new Library(); //instead of here
    newUser.library.save();
    newUser.save(function(err, result){
      if(err){
        res.status(500).json(err);
      } else {
        res.json(result);
        //new librarty push here for multiple libraries later intead of stuff at top (call sep function)
      }
    })
  },
  editUser: function(req, res){
    User.findByIdAndUpdate(req.params.id, req.body, function(err, result){
      if(err){
        res.status(500).json(err);
      } else {
        res.json(result);
      }
    })
  },
  deleteUser: function(req, res) {
    User.findByIdAndRemove(req.params.id, function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        res.json(result);
      };
    });
  },


};
