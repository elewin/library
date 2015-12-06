var Library = require('../models/librarySchema');
var User = require('../models/userSchema');

module.exports = {
  getLibrary: function(req, res){
    Order.findById(req.params.id, function(err, order){
      if(err){
        res.status(500).json(err);
      } else {
        User.populate(library, function(err, theLibrary){
          if(err){
            res.status(500).json(err);
          } else {
            res.json(theLibrary);
          }
        })
      }
    })
  },

  getLibraryTemp: function(req, res){
    Library.find(req.query).exec(function(err, result){
      if(err) {
        res.status(500).json(err);
      } else {
        res.json(result);
      };
    });
  },

  addLibrary: function(req, res){
    var newLibrary = new Library(req.body);
    newLibrary.save(function(err, result){
      if(err){
        res.status(500).json(err);
      } else {
        res.json(result);
      };
    });
  },
  editLibrary: function(req, res){
    Library.findByIdAndUpdate(req.params.id, req.body, function(err, result){
      if(err){
        res.status(500).json(err);
      } else {
        res.json(result);
      };
    });
  },
  deleteLibrary: function(req, res) {
    Library.findByIdAndRemove(req.params.id, function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        res.json(result);
      };
    });
  },
}
