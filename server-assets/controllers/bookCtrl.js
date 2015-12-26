//var mongoose = require('mongoose');
var Book = require('../models/bookSchema');
var Library = require('../models/librarySchema');
var googBooksCtrl = require('./googBooksCtrl');
var amazonCtrl = require('./amazonCtrl');
var q = require('q'); //promises library

//tests if a given isbn number meets certain validity critera and returns a bool
var checkIsbn = function(isbn){
  //We need to check if we have a valid ISBN. ISBNs are either 9, 10, or 13 digit strings of numbers. Here we're just making sure its between 9 and 13 and only contains numbers, though it may have an X at the end. A more robust check could be added later but this should filter most bad data for now.

  var goodIsbn = true;
  var isbnLength = isbn.length; //calcualte the length once to save some time since we'll be calling it more than once
  var trailingX = false; //this is to handle the special case of the final character in the ISBN being an 'X'

  //check if the last character is an 'x'
  if (isbn[isbnLength-1].toLowerCase() === 'x'){
    trailingX = true;
  }

  //check length
  if (isbnLength < 9 || isbnLength > 13){
    goodIsbn = false;
  }

  //if there is an X at the end, we will tempoartily remove it for the numeric character check
  if(trailingX){
    isbn = isbn.slice(0, -1);
  }

  //check for non-numeric characters (trailing X has already been tempoarily removed if present). This may let decimals get by though.
  if (isNaN(isbn)){
    goodIsbn = false;
  }

  //if it had a trailing X, add it back now that our numeric check is complete
  if(trailingX){
    isbn+='X';
  }
  return goodIsbn; //return the result
};


module.exports = {

  //searches the Amazon Products API for the book given the paramters in req.query
  searchAzForBook: function(req, res){
    amazonCtrl.searchForBook(req.query).then(function(results){
      return res.json(results);
    }).catch(function(err){
      if (err[0].Error[0].Code[0] === 'AWS.ECommerceService.NoExactMatches'){ //this is what returns if nothing is found
        console.log('Amazon: ',err[0].Error[0].Message[0]);
        return res.status(404).end();
      }
      else{
        console.log('bookCtrl.searchAzForBook error on', req.query, 'Error:', JSON.stringify(err)); //if something else went wrong
        return res.status(500).end();
      }
    });
  },

  //search the db for a book given a search paramater (author, title, keyword) and search term. Returns a promise.
  searchForBook: function(req, res){
    var searchParams = req.query;
    var deferred = q.defer();

    var searchObj = {};

    if(searchParams.param === 'title' || searchParams.param === 'author'){
      searchObj[searchParams.param] = {
        "$regex": searchParams.term,
        "$options": "i"
      };
    }

    //this is a more expensive search
    if(searchParams.param === 'keywords'){
      searchObj = {
        $or:[
          {
            title: {
              "$regex": searchParams.term,
              "$options": "i"
            }
          },
          {
          author: {
            "$regex": searchParams.term,
            "$options": "i"
            }
          },
          {
          googDescription: {
            "$regex": searchParams.term,
            "$options": "i"
            }
          },
          {
          azDescription: {
            "$regex": searchParams.term,
            "$options": "i"
            }
          },
          {
          tags: {
            "$regex": searchParams.term,
            "$options": "i"
            }
          },
        ]
      };
    }

    Book.find(searchObj).exec().then(function(results){

      console.log(results);
    }).catch(function(err){
      console.log(err);
      return res.status(400).send(err);
    });

    return deferred.promise;
  },

  //Adds a book given an ISBN and retrieves data from the gooble books API and the Amazon Products API.
  addBookByIsbn: function(req, res) {
    var newBook = new Book(req.body); //req.body should be {isbn: <isbn number>}

    //Often ISBNs have dashes inserted for readability, so we need to strip those out:
    var filteredIsbn ='';
    for (var i = 0; i < newBook.isbn.length; i++){
      if (newBook.isbn[i] !== '-'){
        filteredIsbn += newBook.isbn[i]; //filter out the dashes
      }
    }
    newBook.isbn = filteredIsbn;

    var goodIsbn = checkIsbn(newBook.isbn); //check if the isbn meets the validity critera

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
