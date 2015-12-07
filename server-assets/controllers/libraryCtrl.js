var Library = require('../models/librarySchema');
var User = require('../models/userSchema');


module.exports = {
  // getLibrary: function(req, res){
  //   console.log('getLibrary');
  //   Library.findById(req.params.id).populate('books').exec(function(err, result){
  //     if (err){
  //       res.status(500).send(err);
  //     }
  //     console.log(result);
  //     res.send(result);
  //   });
  // },


  getUserLibrary: function(req, res){
    Library.findById(req.params.id).populate('books').exec(function(err, result){
      if (err){
        res.status(505).send(err);
      }
    //  console.log(result);
      res.send(result);
    });
  },

 ///this should be removed later since we dont need to see every users library
  getAllLibraries: function(req, res){
    //console.log('getAllLibraries');
    Library.find(req.query).populate('books').exec(function(err, result){
      if (err){
        res.status(506).send(err);
      }
      //console.log(result);
      res.send(result);
    });
  },

  addLibrary: function(req, res){
    var newLibrary = new Library(req.body);
    newLibrary.save(function(err, result){
      if(err){
        res.status(507).json(err);
      } else {
        res.json(result);
      };
    });
  },

  // addLibraryToUser: function(req, res){
  //   var newLibrary = new Library(req.body);
  //   newLibrary.save(function(err, result){
  //     if(err){
  //       res.status(500).json(err);
  //     } else {
  //       res.json(result);
  //     };
  //   });
  // },


  addBookToLibrary: function(req, res){
    Library.findById(req.params.id).exec().then(function(library){
      var books = library.books;
      console.log('server libraryCtrl addLibraryToUser books:', books);
      books.push(req.body.books);
      return library.save().then(function(theLibrary){
        return res.json(theLibrary);
      });
    }).catch(function(err){
      return res.status(508).json(err);
    });
  },

  editLibrary: function(req, res){
    Library.findByIdAndUpdate(req.params.id, req.body, function(err, result){
      if(err){
        res.status(509).json(err);
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
