var Library = require('../models/librarySchema');
var User = require('../models/userSchema');
var Book = require('../models/bookSchema');
var userCtrl = require('./userCtrl');


module.exports = {

  getUserLibrary: function(req, res){
  //make sure a user is logged in, and that they are getting their own library (or have admin privledges)
  if (req.user && (req.user.library === req.query || req.user.roles.indexOf('admin') >=0)){
    Library.find(req.query).populate('books.book.bookData').exec(function(err, result){
        if (err){
          res.status(400).send(err);
        }
        res.send(result);
      });
    } else return res.status(401).end();
  },

  //checks if a user has a book in his/her library, returns a bool
  doesUserHaveBook: function(req, res){
    var libraryId = req.params.id;
    var isbn = req.query.isbn;
    var result = false;

    if (req.user && req.user.library === libraryId){ //make sure someone doesnt try to mess with someone else's library
      Library.findById(libraryId).populate('books.book.bookData').exec()
      .then(function(library){
        for (var i = 0; i < library.books.length; i++){ //iterate through the books in this library
          if (library.books[i].book.bookData.isbn === isbn){ //and check if the isbn matches
            result = true;
          }
        }
        return res.send(result).end();
      }).catch(function(err){
        console.log('libraryCtrl.doesUserHaveBook error:', err);
        return res.status(500).end();
      });
    }else{
      return res.send(false).end(); //if there is no libraryId, send false; (make this an object that also tells us that there was no libraryid/user?)
    }
  },

  //given a user id, return the populated library with a matching ownerId field:
  getUserLibraryByUserId: function(req, res){
    if (req.user && (req.user._id === req.params.id || req.user.roles.indexOf('admin') >=0)){
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
    } else return res.status(401).end();
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
        if (req.user && (req.user.library === libraryId || req.user.roles.indexOf('admin') >=0)){
          Library.findById(libraryId).exec().then(function(library){
          var books = library.books; //the array of books in the library that we will be adding to
          books.push(bookObj); //add the new book to the array of books
          return library.save().then(function(){ //save the library with our new book in it
            Book.findById(bookId).exec().then(function(thisBook){
              thisBook.numOwners++; //increment the number of owners of this book
              thisBook.save().then(function(){
                return res.status(201).end();
              }).catch(function(err){
                console.log('libraryCtrl.addBookToLibrary/addBook on thisBook.save():', err);
              });
            }).catch(function(err){
              console.log('libraryCtrl.addBookToLibrary error finding book numOwners', err);
            });
          }).catch(function(err){ //something broke
            console.log('libraryCtrl.addBookToLibrary/addBook on library.save(): ', err, JSON.stringify(err,null,2));
            return res.status(500).json(err);
          });
        }).catch(function(err){ //uh-oh
          console.log('libraryCtrl.addBookToLibrary/addBook: ', err, JSON.stringify(err,null,2));
          return res.status(400).json(err);
        });
      } else return res.status(401).end();
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


  removeBookFromLibrary: function(req, res){
    var bookToDelete = req.body.books.book.bookData; // the ._id of the book as it pertains to the main book collection
    if (req.user && (req.user.library === req.params.id || req.user.roles.indexOf('admin') >=0)){
      Library.findById(req.params.id).exec().then(function(library){
        var books = library.books;

        //Each book in a user's library effectivly has two different IDs -- it has an ._id which represents its unique mongodb entry in their specific library collection, and a book.bookData string (objectID) which is the ._id of that book in the main boook roster collection. Because bookToDelete is the ._id of the book as it pertains to the main book collection, we have to find the book in the user's library whose bookData entry matches it. If we search for just the _id of each book within their library, we will not get a match. At first using indexOf() was considered, but because we are looking deep into the object at each element, instead here we will iterate through the array of books looking to evaluate book.bookData and compare it to bookToDelete:
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
          Book.findById(bookToDelete).exec().then(function(theBook){
            theBook.numOwners--; //update our counter
            theBook.save().then(function(){
              return res.status(204).end();
            }).catch(function(err){
              console.log('removeBookFromLibrary error while attempting to save book after update', err);
            });
          }).catch(function(err){
            console.log('removeBookFromLibrary error searching for book to update', err);
          });
        }).catch(function(err){
          console.log('removeBookFromLibrary error on library.save()', err);
        });
      }).catch(function(err){
        console.log('removeBookFromLibrary error:', err);
        return res.status(500).json(err);
      });
    } else return res.status(401).end();
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
    if (req.user &&(req.user.library === req.params.id || req.user.roles.indexOf('admin') >=0)){
      Library.findByIdAndRemove(req.params.id, function(err, result){
        if(err){
          res.status(400).json(err);
        } else {
          res.json(result);
        }
      });
    } else return res.status(401).end();
  },
};
