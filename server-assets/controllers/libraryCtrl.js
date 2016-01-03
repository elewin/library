var Library = require('../models/librarySchema');
var User = require('../models/userSchema');
var Book = require('../models/bookSchema');
var userCtrl = require('./userCtrl');
var q = require('q'); //promises library

//given a library and a bookId, returns a promise true or false if the book is in the book array of the given library
function findDuplicate(libraryId, bookId){
  bookId = bookId.toString(); //cast bookId to string if we are given an ObjectId
  var deferred = q.defer();
  var duplicate = false;
  Library.findById(libraryId).populate('books.book.bookData').exec().then(function(library){
    for (var i =0; i < library.books.length; i++){
      if(library.books[i].book.bookData._id.toString() === bookId){ //compare bookIds to those in the library
        duplicate = true;
        deferred.resolve(true);
      }
    }
    if (!duplicate){
      deferred.resolve(false);
    }
  }).catch(function(err){
    console.log('libraryCtrl.addBookToLibrary findDuplicate() error while searching for duplicates:', err);
  });
  return deferred.promise;
}


module.exports = {

  //edits a book in a user's library collection
  editBookInLibrary: function(req, res){
    var libraryId = req.params.libraryId;
    var bookId = req.params.bookId;
    var property = req.body.property; //the property on the book we are updating
    var value = req.body.value; //what we are updating it to

    //security to make sure a user can only get their own library (unless admin)
    if (req.user && (req.user.library === libraryId || req.user.roles.indexOf('admin') >=0)){
      Library.findById(libraryId).populate('books.book.bookData').exec()
      .then(function(library){
        var books = library.books; //this is the array of books in this library
        var foundBookIndex = -1; //we need to find where in the books array the book we're looking for is located
        //we iterate through the array looking for the element that has the bookId we want
        for (var i = 0; i < books.length; i++){
          if(books[i].book.bookCollectionId === bookId){
            foundBookIndex = i; //this is the index in the books array where the book we want is located
          }
        }
          //if we could not find the book, give an error:
          if (foundBookIndex === -1){
            console.log('libraryCtrl.editBookInLibrary error: could not find bookId', bookId, 'in library', libraryId);
            return res.status(404).end();
          }else{
            //if we are succesful:
            var oldValue = books[foundBookIndex].book[property];
            books[foundBookIndex].book[property] = value;//books[foundBookIndex].book is the book we are editing
            library.save().then(function(){ //save the updated book

              //now, if applicable, we need to update the main values for that book on the book collection depending on what we just did:
              Book.findById(bookId).exec().then(function(foundBook){
                if (property === 'status'){ //if we updated the status of the book:
                  if (oldValue === 'unread' && value === 'read') foundBook.numRead++;
                  if (oldValue === 'unread' && value === 'reading') foundBook.numCurrentlyReading++;
                  if (oldValue === 'read' && value === 'unread') foundBook.numRead--;
                  if (oldValue === 'read' && value === 'reading'){
                    foundBook.numRead--;
                    foundBook.numCurrentlyReading++;
                  }
                  if (oldValue === 'reading' && value == 'unread') foundBook.numCurrentlyReading--;
                  if (oldValue === 'reading' && value == 'read'){
                    foundBook.numCurrentlyReading--;
                    foundBook.numRead++;
                  }
                }
                if (property === 'own'){
                  if (value === true) foundBook.numOwnBook++;
                  if (value === false) foundBook.numOwnBook--;
                }
                if (property === 'rating'){
                  foundBook.totalScore += value;
                  foundBook.numReviews++;
                }

                //save the result:
                foundBook.save().then(function(){
                  return res.status(200).end();
                }).catch(function(err){
                  console.log('error saving foundBook after updating stats', err);
                });
              }).catch(function(err){
                console.log('error finding book after edit save', err);
              });
              return res.status(200).end();
            }).catch(function(err){
              console.log('error saving library after update', err);
              return res.status(500).end();
            });
          }
      }).catch(function(err){
        console.log('libraryCtrl.getBookFromLibrary', err);
      });
    }else{
      return res.status(401).end();
    }

  },

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

  //this is now redundant given the findDuplicate() function above, ill refactor this later to use it
  //checks if a user has a book in his/her library, returns a bool
  doesUserHaveBook: function(req, res){
    var libraryId = req.params.id;
    var isbn = req.query.isbn;
    var result = false;

    if (req.user && (req.user.library === libraryId || req.user.roles.indexOf('admin') >=0)){ //make sure someone doesnt try to mess with someone else's library
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

      findDuplicate(libraryId, bookId).then(function(duplicate){
        if(!duplicate){
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
        }else{
          return res.status(409).end(); //this is a duplicate
        }
      }).catch(function(err){
        console.log('libraryCtrl.addBookToLibrary error after searching for duplicates', err);
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

  //returns the requested book from the given library (this differs from making a request for a book from bookCtrl, as that will return a book from the main book collection. This returns a book from a specific library, which has additional user-specific properties)
  getBookFromLibrary: function(req, res){
    var bookId = req.params.bookId;
    var libraryId = req.params.libraryId;
    //security to make sure a user can only get their own library (unless admin)
    if (req.user && (req.user.library === libraryId || req.user.roles.indexOf('admin') >=0)){
      Library.findOne(libraryId).populate('books.book.bookData').exec()
      .then(function(library){
        var books = library.books; //this is the array of books in this library
        var foundBookIndex = -1; //we need to find where in the books array the book we're looking for is located
        //we iterate through the array looking for the element that has the bookId we want
        for (var i = 0; i < books.length; i++){
          if(books[i].book.bookCollectionId === bookId){
            foundBookIndex = i; //this is the index in the books array where the book we want is located
          }
        }
          //if we could not find the book, give an error:
          if (foundBookIndex === -1){
            console.log('libraryCtrl.getBookFromLibrary error: could not find bookId', bookId, 'in library', libraryId);
            return res.status(404).end();
          }else{
            return res.send(books[foundBookIndex].book).end();
          }
      }).catch(function(err){
        console.log('libraryCtrl.getBookFromLibrary', err);
      });
    }else{
      return res.status(401).end();
    }
  },

  //removes a specific book from a specific library given a libraryId and bookId
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

        //get their stats so we can adjust the global counters:
        var own = books[bookToRemoveIndex].book.own;
        var status = books[bookToRemoveIndex].book.status;
        var rating = books[bookToRemoveIndex].book.rating;

        books.splice(bookToRemoveIndex, 1); //remove the book at the index where it was found
        library.save().then(function(theLibrary){ //save the result
          Book.findById(bookToDelete).exec().then(function(theBook){
            //adjust our counters:
            theBook.numOwners--;
            if(own) theBook.numOwnBook--; //if the user owned this book, decrement the counter
            if(status === 'read') theBook.numRead--;
            if(status === 'reading') theBook.numCurrentlyReading--;
            if(rating > 0){ //if the user has made a rating, remove that score
              theBook.totalScore -= rating;
              theBook.numReviews --;
            }

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
