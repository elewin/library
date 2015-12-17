var Library = require('../models/librarySchema');
var User = require('../models/userSchema');


module.exports = {

  getUserLibrary: function(req, res){
  //  Library.findById(req.params.id).populate('books').exec(function(err, result){
  Library.find(req.query).populate('books.book.bookData').exec(function(err, result){
      if (err){
        res.status(400).send(err);
      }
      res.send(result);
    });
  },

  //INCOMPLETE
  //given a user id, return the library with a matching ownerId field:
  getUserLibraryByUserId: function(req, res){
    console.log(req.query);
    Library.findOne({'ownerId' : req.query}).populate('books.book.bookData').exec()
    .then(function(library){

    });
  },

 ///this should be removed later since we dont need to see every users library
  getAllLibraries: function(req, res){
    // Library.find(req.query).populate('books').exec(function(err, result){ //wors w old schema
    Library.find(req.query).populate('books.book.bookData').exec(function(err, result){
      if (err){
        res.status(400).send(err);
      }
      res.send(result);
    });
  },

  addLibrary: function(req, res){
    var newLibrary = new Library(req.body);
    newLibrary.save(function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        res.json(result);
      }
    });
  },

  addBookToLibrary: function(req, res){
    Library.findById(req.params.id).exec().then(function(library){
      var books = library.books;
      books.push(req.body.books);
      return library.save().then(function(theLibrary){
        return res.json(theLibrary);
      });
    }).catch(function(err){
      return res.status(400).json(err);
    });
  },

  removeBookFromLibrary: function(req, res){
    Library.findById(req.params.id).exec().then(function(library){
      var books = library.books;
      var bookToRemoveIndex = books.indexOf(req.body.books);
      books.splice(bookToRemoveIndex, 1);
      return library.save().then(function(theLibrary){
       return res.json(theLibrary);
      });
    }).catch(function(err){
      return res.status(400).json(err);
    });
  },

  editLibrary: function(req, res){
    Library.findByIdAndUpdate(req.params.id, req.body, function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        res.json(result);
      }
    });
  },
  deleteLibrary: function(req, res) {
    Library.findByIdAndRemove(req.params.id, function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        res.json(result);
      }
    });
  },
};
