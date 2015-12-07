var Library = require('../models/librarySchema');
var User = require('../models/userSchema');

// var q =require('q');
//
// var getLibrary = function(libraryId){
//   var deferred = q.defer();
//   Library.find({
//     _id: libraryId,
//   }, function (err, results){
//     if (!err){
//       console.log ('library found:', results);
//       deferred.resolve(results[0]);
//     }else {
//       console.log('error on getLibrary:', err);
//       deferred.reject(err);
//     }
//   });
//   return deferred.promise;
// }

module.exports = {
  getLibrary: function(req, res){
    Order.findById(req.params.id, function(err, order){
      if(err){
        res.status(500).json(err);
      } else {
        library.populate(library, function(err, theLibrary){
          console.log(theLibrary);
          if(err){
            res.status(500).json(err);
          } else {
            res.json(theLibrary);
          }
        })
      }
    })
  },

  getAllLibraries: function(req, res){
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
  // addBook: function(req, res){
  //   var library = getLibrary(req.params.id).then(function (library) {
  //     library.books.push(req.body);
  //     library.save().then(function (results) {
  //       console.log('results from library update', results);
  //       res.status(200).send(results);
  //     });
  //   });
  // },


}
