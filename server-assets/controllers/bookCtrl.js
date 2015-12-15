var mongoose = require('mongoose');
var Book = require('../models/bookSchema');
var Library = require('../models/librarySchema');
var googBooksCtrl = require('./googBooksCtrl');
var amazonCtrl = require('./amazonCtrl');

//this method takes ISBN data (if entered), queries the Google Books API, and then updates the properties of the book with the data returned. It then adds the new book to the database.
module.exports = {
  addBook: function(req, res) {
    var newBook = new Book(req.body);

    //check if we have a valid ISBN: (ISBNs are either 9 or 13 digit strings of numbers. Here we're just making sure its at least 9 and only contains numbers. A more robust check could be added later but this should filter most bad data for now)
    if (newBook.isbn.length >= 9 && !isNaN(newBook.isbn)){
      googBooksCtrl.updateFromGoogleBooks(newBook).then(function(book){ //update properties form the Google Books API
        newBook = book; //assign the book with the gathered google books info to the new book

        //put amazon update here?

        newBook.save().then(function(theBook) { //save the book
          return res.json(theBook); //return the book
        }).catch(function(err) {
          console.log(err);
          return res.status(400).json(err);
        });
      });
    }else{
      //still save the book with what we were given even if the ISBN is bad (or missing)
      newBook.save().then(function(doc) {
        return res.json(doc);
      }).catch(function(err) {
        console.log(err);
        return res.status(400).json(err);
      });
    }
  },

  //this method will query the Amazon Products API to fill in book properties possibly missed by the Google Books API
  azUpdate : function(req, res){
    Book.findByIdAndUpdate(req.params.id, req.body, {new: true}).exec()
    .then(function(book) {
      amazonCtrl.updateFromAmazon(book)
      .then(function(azBook){
        book = azBook;  //assign new properties gathered from the Amazon API to our book
        book.save() //save the book to the database
        .then(function(book){
          return res.json(book);
          }).catch(function(err){
            console.log(err);
        });
      }).catch(function(err) {
        console.log(err);
        return res.status(400).json('azUpdate error:', err);
      });
    });
  },

  getBooks:  function(req, res) {
    Book.find(req.query).exec().then(function(docs) {
      return res.json(docs);
    }).catch(function(err) {
      return res.status(400).json(err);
    });
  },

  getBook: function(req, res){
    Book.findById(req.params.id, function(err){
      return res.json(docs);
    }).catch(function(err) {
      return res.status(400).json(err);
    });
  },

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
                docs[i].books.splice(j,1);
              }
              docs[i].save();
            }
          }
        });
        res.json(result);
      }
    });
  }

};
