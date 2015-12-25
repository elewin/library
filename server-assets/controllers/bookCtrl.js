var mongoose = require('mongoose');
var Book = require('../models/bookSchema');
var Library = require('../models/librarySchema');
var googBooksCtrl = require('./googBooksCtrl');
var amazonCtrl = require('./amazonCtrl');

module.exports = {

  //searches the Amazon Products API for the book given the paramters in req.query
  searchAzForBook: function(req, res){
    amazonCtrl.searchForBook(req.query).then(function(results){
      return res.json(results);
    }).catch(function(err){
      console.log('bookCtrl.searchAzForBook Error:', err);
      return res.status(500).end();
    });
  },


  //Adds a book given an ISBN and retrieves data from the gooble books API and the Amazon Products API.
  addBookByIsbn: function(req, res) {
    var newBook = new Book(req.body); //req.body should be {isbn: <isbn number>}

    //We need to check if we have a valid ISBN. ISBNs are either 9, 10, or 13 digit strings of numbers. Often they have dashes inserted for readability, so we need to strip those out. Here we're just making sure its at least 9 and only contains numbers, though may have an X at the end. A more robust check could be added later but this should filter most bad data for now.

    //this whole part should probably be moved to its own function to reduce clutter

    var goodIsbn = true;

    //filter dashes from isbn and handle the special case of a trailing 'X':
    var isbnLength = newBook.isbn.length; //calcualte the length once to save some time since we'll be calling it more than once
    var trailingX = false;
    var filteredIsbn ='';

    //check if the last character is an 'x'
    if (newBook.isbn[isbnLength-1].toLowerCase() === 'x'){
      trailingX = true;
    }

    for (var i = 0; i < isbnLength; i++){
      if (newBook.isbn[i] !== '-'){
        filteredIsbn += newBook.isbn[i]; //filter out the dashes
      }
    }
    newBook.isbn = filteredIsbn;
    isbnLength = newBook.isbn.length; //recalculate the length now that the dashes have been removed

    //check length
    if (isbnLength < 9 || isbnLength > 13){
      goodIsbn = false;
    }

    if(trailingX){
      newBook.isbn = newBook.isbn.slice(0, -1);
    }

    //check for non-numeric characters (trailing X has already been tempoartily removed if present)
    if (isNaN(newBook.isbn)){
      goodIsbn = false;
    }

    //add the trailing x back now that our checks are complete
    if(trailingX){
      newBook.isbn+='x';
    }

    //make sure this is not a duplicate:
    Book.findOne({$or:[{'isbn10' : newBook.isbn}, {'isbn13' : newBook.isbn}, {'isbn' : newBook.isbn}]}).exec()
    .then(function(foundBook){
      if(!foundBook){
        if (goodIsbn){
        //if (newBook.isbn.length >= 9 && !isNaN(newBook.isbn)){
          googBooksCtrl.updateFromGoogleBooks(newBook).then(function(book){ //update properties form the Google Books API
            newBook = book; //assign the book with the gathered google books info to the new book
            amazonCtrl.updateFromAmazon(newBook).then(function(azBook){ //call the amazon products api and update the book with the data returned
              newBook = azBook;
              newBook.save().then(function(theBook) { //save the book
                return res.status(201).end;
              });
            }).catch(function(err) {
              console.log('bookCtrl.addBookByIsbn:',err);
              return res.status(500).json(err);
            });
          });
        }else{
          //if the ISBN is invalid then return an error code
          console.log('bad ISBN:', newBook.isbn);
          return res.status(400).json();
        }
      }else { //if that ISBN already exists in our book roster:
        {
          console.log('Book already exists! ._id:', foundBook._id, 'ISBN:', foundBook.isbn10, '/', foundBook.isbn13);
          return res.status(409).json({error: "Book already exists!"});
        }
      }
    });
  },

  // *** Old version: does not automatically call amazon update
  // addBook: function(req, res) {
  //   var newBook = new Book(req.body);
  //
  //   //filter dashes from isbn
  //   var filteredIsbn ='';
  //   for (var i = 0; i < newBook.isbn.length; i++){
  //     if (newBook.isbn[i] !== '-'){
  //        filteredIsbn += newBook.isbn[i]; //filter out the dashes
  //     }
  //   }
  //   newBook.isbn = filteredIsbn;
  //   //make sure this is not a duplicate:
  //   Book.findOne({$or:[{'isbn10' : newBook.isbn}, {'isbn13' : newBook.isbn}, {'isbn' : newBook.isbn}]}).exec()
  //   .then(function(foundBook){
  //     if(!foundBook){
  //       //check if we have a valid ISBN: (ISBNs are either 9 or 13 digit strings of numbers. Here we're just making sure its at least 9 and only contains numbers. A more robust check could be added later but this should filter most bad data for now)
  //       if (newBook.isbn.length >= 9 && !isNaN(newBook.isbn)){
  //         googBooksCtrl.updateFromGoogleBooks(newBook).then(function(book){ //update properties form the Google Books API
  //           newBook = book; //assign the book with the gathered google books info to the new book
  //
  //           //put amazon update here?
  //
  //           newBook.save().then(function(theBook) { //save the book
  //             return res.status(201).end;
  //             //return res.json(theBook); //return the book
  //           }).catch(function(err) {
  //             console.log(err);
  //             return res.status(400).json(err);
  //           });
  //         });
  //       }else{
  //         //if the ISBN is invalid then return an error code
  //         console.log('bad ISBN:', newBook.isbn);
  //         return res.status(400).json();
  //       }
  //     }else {
  //       {
  //         console.log('Book already exists!:', foundBook.isbn10, foundBook.isbn13);
  //         return res.status(409).json({error: "Book already exists!"});
  //       }
  //     }
  //   });
  // },


  //DEPRECATED, this is now built in to the add book method and done automatically
  // //this method will query the Amazon Products API to fill in book properties possibly missed by the Google Books API
  // azUpdate : function(req, res){
  //   Book.findByIdAndUpdate(req.params.id, req.body, {new: true}).exec()
  //   .then(function(book) {
  //     amazonCtrl.updateFromAmazon(book)
  //     .then(function(azBook){
  //       book = azBook;  //assign new properties gathered from the Amazon API to our book
  //       book.save() //save the book to the database
  //       .then(function(book){
  //         return res.json(book);
  //         }).catch(function(err){
  //           console.log(err);
  //       });
  //     }).catch(function(err) {
  //       console.log(err);
  //       return res.status(400).json('azUpdate error:', err);
  //     });
  //   });
  // },

  getBooks:  function(req, res) {
    Book.find(req.query).exec().then(function(docs) {
      return res.json(docs);
    }).catch(function(err) {
      return res.status(400).json(err);
    });
  },

  // deprecated?
  // getBook: function(req, res){
  //   console.log('wtf');
  //   Book.findById(req.params.id, function(err){
  //     return res.json(docs);
  //   }).catch(function(err) {
  //     return res.status(400).json(err);
  //   });
  // },

  editBook: function(req, res) {
    Book.findByIdAndUpdate(req.params.id, req.body, {new: true}).exec().then(function(doc) {
      return res.json(doc);
    }).catch(function(err) {
      console.log(err);
      return res.status(400).json(err);
    });
  },

  deleteBook: function(req, res) {
    Book.findByIdAndRemove(req.params.id, function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        Library.find({'books.book.bookData': req.params.id}).exec().then(function(docs) {
          //loop through the libraries that contain this book and splice it out
          for (var i = 0; i < docs.length; i++){
            for(var j = 0; j< docs[i].books.length; j++){
              if (docs[i].books[j].book.bookData == req.params.id){ // == instead of === is on purpose here!
                docs[i].books.splice(j,1); //remove 1 element at position j, which is the book we are deleting
              }
              docs[i].save(); //save the library with our changes
            }
          }
        });
        res.json(result);
      }
    });
  }

};
