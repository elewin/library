var Library = require('../models/librarySchema');
var User = require('../models/userSchema');
var Book = require('../models/bookSchema');


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

  //DEPRECATED:
  // // old method, took data object in the PUT request:
  // // data: {
  // //   books: {
  // //     book: {bookData: bookId},
  // //   }
  // // },
  // addBookToLibrary: function(req, res){
  //
  //   var newBookObj = req.body.books; //this is the object of our new book, assigning it req.body.books will include bookData which is a ref to the book we are adding
  //   newBookObj.book.bookCollectionId = req.body.books.book.bookData; //here we are filling in the bookId field with the book's ID from the main book collection. This is so we can more easily search for this book ID later (eg, when searching for this book in the case of removing it from the library. The _id of this book being created right now will refer to the book within the user's library, not the book within the main book colleciton. Mixing up these two elsewhere will lead to problems that may be difficult to notice/debug)
  //
  //   console.log('newBookObj', newBookObj);
  //
  //   Library.findById(req.params.id).exec().then(function(library){ //find the target library
  //     var books = library.books; //the array of books in the library
  //     books.push(newBookObj); //add the new book to the array of books
  //     return library.save().then(function(theLibrary){ //save the library with our new book in it
  //       return res.json(theLibrary);
  //     });
  //   }).catch(function(err){ //uh-oh
  //     return res.status(400).json(err);
  //   });
  // },

  //***later, secure this by checking if use is admin, and if not only allow this to go through if this library id matches that which belongs to the logged in user id
  //this takes a query of either bookId or isbn and adds that book to the user's library. eg: /api/library/:id/add?isbn=9780142004371 or /api/library/:id/add?bookId=1234567890abc
  addBookToLibrary: function(req, res){
    var libraryId = req.params.id;

    // this function will add the book with bookId to the library passed in req.params.id
    var addBook = function(bookId){

      //this is the object of the book which we will add to our library
      var bookObj = {
        book: {
          bookData: bookId, //bookData which is a ref to the book we are adding
          bookCollectionId: bookId, //here we are filling in the bookId field with the book's ID from the main book collection. This is so we can more easily search for this book ID later (eg, when searching for this book in the case of removing it from the library. The _id of this book being created right now will refer to the book within the user's library, not the book within the main book colleciton. Mixing up these two elsewhere will lead to problems that may be difficult to notice/debug, so establishing this here will be helpful)
        }
      };
      //now find the library we need to add the book to
      Library.findById(libraryId).exec().then(function(library){
        var books = library.books; //the array of books in the library that we will be adding to
        books.push(bookObj); //add the new book to the array of books
        return library.save().then(function(){ //save the library with our new book in it
          return res.status(201).end();
        }).catch(function(err){ //something broke
          console.log('libraryCtrl.addBookToLibrary/addBook on library.save(): ', JSON.stringify(err,null,2));
          return res.status(500).json(err);
        });
      }).catch(function(err){ //uh-oh
        console.log('libraryCtrl.addBookToLibrary/addBook: ', JSON.stringify(err,null,2));
        return res.status(400).json(err);
      });
    };

    //if we're passed an ISBN, then we will look up the book that corosponds to it and then add that book to the library
    if (req.query.isbn){
      var isbn = req.query.isbn;
      Book.findOne({$or:[{'isbn10' : isbn}, {'isbn13' : isbn}, {'isbn' : isbn}]}).exec() //search for the ISBN
      .then(function(book){ //return the book that matches it
        addBook(book._id); //add the book
      });
    }
    else{ //if we are passed a bookId, then we do not need to look anything up and go straight to adding that bookId to the library
      if (req.query.bookId){
        addBook(req.query.bookId);
      }
      else { //this should only happen if neither isbn nor bookId was passed in the query
        console.log('Did you pass the query correctly?', req.query);
        return res.status(400).end();
      }
    }
  },


  // old but working
  // //***later, secure this by checking if use is admin, and if not only allow this to go through if this library id matches that which belongs to the logged in user id
  // addBookToLibrary: function(req, res){
  //   Library.findById(req.params.id).exec().then(function(library){
  //     var books = library.books;
  //     books.push(req.body.books);
  //     return library.save().then(function(theLibrary){
  //       return res.json(theLibrary);
  //     });
  //   }).catch(function(err){
  //     return res.status(400).json(err);
  //   });
  // },


  //***later, secure this by checking if use is admin, and if not only allow this to go through if this library id matches that which belongs to the logged in user id
  removeBookFromLibrary: function(req, res){

    var bookToDelete = req.body.books.book.bookData;

    Library.findById(req.params.id).exec().then(function(library){
      var books = library.books;

      //Each book in a user's library effectivly has two different IDs -- it has an ._id which represents its unique mongodb entry in their specific library collection, and a book.bookData string which is the ._id of that book in the main boook roster collection. Because bookToDelete is the ._id of the book as it pertains to the main book collection, we have to find the book in the user's library whose bookData entry matches it. If we search for just the _id of each book within their library, we will not get a match. At first using indexOf() was considered, but because we are looking deep into the object at each element, instead here we will iterate through the array of books looking to evaluate book.bookData and compare it to bookToDelete:
      var bookToRemoveIndex = -1; //the index of the book to delete. Default is -1 if no match is found.
      for (var i = 0; i < books.length; i++){
        if (books[i].book.bookCollectionId === bookToDelete){ //find where in the array the book is located
          bookToRemoveIndex = i;
        }
      }

      if(bookToRemoveIndex === -1){ //error handling if no match is found
        return res.status(404).json('Book', bookToDelete, 'not found!');
      }

      books.splice(bookToRemoveIndex, 1); //remove the book at the index where it was found
      return library.save().then(function(theLibrary){ //save the result
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
