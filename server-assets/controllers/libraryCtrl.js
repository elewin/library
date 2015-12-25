var Library = require('../models/librarySchema');
var User = require('../models/userSchema');


module.exports = {

  //***later, secure this by checking if use is admin, and if not only allow this to go through if the logged in user id/library id matches the library id to be edited
  getUserLibrary: function(req, res){
  //  Library.findById(req.params.id).populate('books').exec(function(err, result){
  Library.find(req.query).populate('books.book.bookData').exec(function(err, result){
      if (err){
        res.status(400).send(err);
      }
      res.send(result);
    });
  },

  //***later, secure this as above
  //given a user id, return the populated library with a matching ownerId field:
  getUserLibraryByUserId: function(req, res){
    Library.findOne({'ownerId' : req.params.id}).populate('books.book.bookData').exec()
    .then(function(library){
      if(library){
        res.send(library);
      }else{
        res.status(404).send({error: "library not found for user._id: " + req.params.id});
      }
    }).catch(function(err){
      res.status(400).send(err);
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

  //***later, secure this by checking if use is admin, and if not only allow this to go through if this library id matches that which belongs to the logged in user id
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

  //BROKEN: indexOf is returning -1, so the method is just removing the last book of the array. bookId is not being passed correctly, or maybe it needs to populate first?

  //ok, We can do this by either going by _id or by bookData. so we need to create an array of the bookData (or _id?) in order, then indexOf on that to find where the bookid we want resides. then we know which index to delete because indexof isnt looking into the key/value pairs in the object. i think! i think bookData is a better way to go, but delete on the library thing is returning _id so that needs to be looked into

  //***later, secure this by checking if use is admin, and if not only allow this to go through if this library id matches that which belongs to the logged in user id
  removeBookFromLibrary: function(req, res){
    //req.params.id is the library, req.body.books is the book -- is it?? no its re.body.books.book.bookData

    var bookToDelete = req.body.books.book.bookData;
    console.log('book to delete: ', bookToDelete);

    Library.findById(req.params.id).exec().then(function(library){
      var books = library.books;
      console.log('books:');
      console.log(books);

      var bookToRemoveIndex = books.indexOf(bookToDelete);

      if(bookToRemoveIndex === -1){
        return res.status(404).json('Book', bookToDelete, 'not found!');
      }
      console.log('idx:', bookToRemoveIndex);
      books.splice(bookToRemoveIndex, 1);
      return library.save().then(function(theLibrary){
       return res.json(theLibrary);
      });
    }).catch(function(err){
      return res.status(400).json(err);
    });
  },

  //determine if this is deprecated
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
