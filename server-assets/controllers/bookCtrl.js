var Book = require('../models/bookSchema');
var Library = require('../models/librarySchema');
var adminCtrl = require('./adminCtrl');
var libraryCtrl = require('./libraryCtrl');
var googBooksCtrl = require('./googBooksCtrl');
var amazonCtrl = require('./amazonCtrl');
var openLibraryCtrl = require('./openLibraryCtrl');
var q = require('q'); //promises library

//filters out a given character from a given string
function filterString(str, char){
  var filteredStr =''; //this will be our output string
  for (var i = 0; i < str.length; i++){
    if (str[i] !== char){ //check if the current character is not what we are filtering out
      filteredStr += str[i]; //if not, add it to the result
    }
  }
  return filteredStr; //the final result should be str but with every instance of char removed
}

//tests if a given isbn number meets certain validity critera and returns a bool. This function assumes that the isbn has already had any dashes in it already filtered out, which can be done using the filterString() function
function checkIsbn(isbn){
  //We need to check if we have a valid ISBN. ISBNs are either 9, 10, or 13 digit strings of numbers. Here we're just making sure its between 9 and 13 and only contains numbers, though it may have an X at the end. A more robust check could be added later but this should filter most bad data for now.

  var goodIsbn = true;
  var isbnLength = isbn.length; //calcualte the length once to save some time since we'll be calling it more than once
  var trailingX = false; //this is to handle the special case of the final character in the ISBN being an 'X'

  //check if the last character is an 'x'
  if (isbn[isbnLength-1].toUpperCase() === 'X'){
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

  return goodIsbn; //return the bool result
}

//search the Amazon Products API for a book given a search paramater (author, title, keyword) and search term, returns a promise
function azSearch(searchParam, searchTerm){
  var deferred = q.defer();

  //set up our search paramaters object
  var searchObj = {
    param: searchParam, //should be 'title', 'author', or 'keywords'
    term: searchTerm    //this is a string of we are searching for
  };

  amazonCtrl.searchForBook(searchObj).then(function(results){ //search results based on our search object
    deferred.resolve(results); //resolve the results of the search
  }).catch(function(err){
    console.log(JSON.stringify(err,null,2));
    if (err[0].Error[0].Code[0] === 'AWS.ECommerceService.NoExactMatches'){ //this is what returns if nothing is found
      console.log('bookCtrl.azSearch: ',err[0].Error[0].Message[0]);
      deferred.resolve([]); //still send back an empty array if there are no results
    }
    else{
      console.log('bookCtrl.azSearch: ', req.query, 'Error:', JSON.stringify(err,null,2)); //if something else went wrong
      deferred.reject(err);
    }
  });
  return deferred.promise;
}

//search the db for a book given a search paramater (author, title, keyword) and search term, returns a promise
function dbSearch(searchParam, searchTerm){
  var deferred = q.defer();

  var searchObj = {}; //this object will hold our search query data for the database
  var searchOptions = { //what we are searching for in each field
    "$regex": searchTerm,
    "$options": "i"
  };

  //set up the type of search we are conducting based on searchParams. It should be either author, title, or keywords. These are the three paramaters that are searchable through the Amazon Products API, and to maintain consistency and have the search process appear seamless to the user, we will attempt to mimic that here:

  //if we are searching for the author, search just that field
  if(searchParam === 'author'){
    searchObj.authors = searchOptions;
  }
  //if this is a title search, search both title and subtitle
  if (searchParam ==='title'){
    searchObj = {
      $or:[{title: searchOptions}, {subtitle: searchOptions}]
    };
  }
  //keywords search. This is a more expensive search, as it searches through the title, subtitle, author, description, and tags fields (most of which should be indexed however. The descriptions are often too long to be indexed though, so if this becomes overly slow then we might have to exclude them).
  if(searchParam === 'keywords'){
    searchObj = {
      $or:[
        {title: searchOptions},
        {authors: searchOptions},
        {googDescription: searchOptions},
        {azDescription: searchOptions},
        {olDescription: searchOptions},
        {tags: searchOptions},
        {subtitle: searchOptions}
      ],
    };
  }

  Book.find(searchObj).exec().then(function(results){ //search the book collection using the paramters of our searchObj object
    deferred.resolve(results); //resolve the results
  }).catch(function(err){
    console.log('bookCtrl.dbSearch: ', JSON.stringify(err,null,2));
    deferred.reject();
  });

  return deferred.promise;
}

module.exports = {

  //searches both the database and the amazon products api for a given search term based on a given search paramater (title, author, keyword). Returns an object containing an array of objects of both search results
  search: function(req, res){
    var searchParam = req.query.param; //our search paramater
    var searchTerm = req.query.term;   //our search term
    var isbnArr = []; // this will be an array of ISBNs of the results returned from our db search, so that we can easily filter out duplicates from the amazon search later
    var outputArr = []; //the array of our final output of search results

    //the Amazon API freaks out if an apostrophe is in the search term, so we need to filter those out:
    searchTerm = filterString(searchTerm, "'");

    //search our books collection
    dbSearch(searchParam, searchTerm)
    .then(function(dbSearchResult){
      var dbLength = dbSearchResult.length;
      for (var j = 0; j < dbLength; j++){
        //add these ISBNs to our isbnArr to compare against after we get the reuslts back from the amazon api search
        if (dbSearchResult[j].isbn13 !== 'None'){ //dont add the default string 'None' to the isbn array
          isbnArr.push(dbSearchResult[j].isbn13);
        }
        if (dbSearchResult[j].isbn10 !== 'None'){
          isbnArr.push(dbSearchResult[j].isbn10);
        }
      }
      return dbSearchResult;

    }).then(function(dbSearchResult){
      var deferred = q.defer();
      //if a user is logged in, flag any books that are already in their book collection:
      if(req.user){
        libraryCtrl.getIsbnArr(req.user.library).then(function(isbnArr){
          for (var i = 0; i < dbSearchResult.length; i++){
            if(isbnArr.indexOf(dbSearchResult[i].isbn) >= 0){ //check if this book is already in our library
              dbSearchResult[i].inLibrary = true; //set the flag to true
            } else{
               dbSearchResult[i].inLibrary = false; //if not, then set it to false
             }
          }
          deferred.resolve(dbSearchResult);
        }).catch(function(err){
          console.log('bookCtrl.search error calling getIsbnArr: ', err); //something messed up, but this is not eseential to returning search results so we can continue without it
          deferred.resolve(dbSearchResult);
        });

      } else deferred.resolve(dbSearchResult); //if there is no user logged in, then continue on

      return deferred.promise;

    }).then(function(dbSearchResult){
      //then search the amazon api
      azSearch(searchParam, searchTerm)
      .then(function(azSearchResult){

        //clean up the data (remove null ISBNs and duplicates already returned by the database search):
        var arrLength = azSearchResult.length; //the length will change as we iterate through the array so we need to save it first
        for ( var i = arrLength-1; i >= 0; i--){
          //remove results without an ISBN (our entire system is built around ISBN lookups so these books are not able to be added to our book collection, plus these are often garbage results of out of print/unavailable books or oddball editions anyway)
          if(!azSearchResult[i].ItemAttributes[0].ISBN){ //if there is no ISBN. . .
             azSearchResult.splice(i,1); //. . . then remove this element
          }
          else{ //if there is an ISBN present, check if we already returned that result from the db search. If so, remove it:
            if(isbnArr.indexOf(azSearchResult[i].ItemAttributes[0].ISBN[0]) > -1){
               azSearchResult.splice(i,1); //remove this element since it already exists in the db
            }
          }
        }

        //now that the data is cleaned up and we have filtered out duplicates, lets build our final results array:
        for (i = 0; i < dbSearchResult.length; i++){
          outputArr.push({
            type: 'db', //this tells us that it is a database search result (so the front end knows how to parse it)
            data: dbSearchResult[i]
          });
        }
        for (i = 0; i < azSearchResult.length; i++){ //(this is not the same length as arrLength, because that was from before we removed duplicates)
          outputArr.push({
            type: 'az', //this tells us that it is an amazon search result
            data: azSearchResult[i]
          });
        }
        var resultsObj = {
          data: outputArr,
        };

        return res.json(resultsObj); //return the result

      }).catch(function(azErr){ //error handling for amazon search
        console.log('bookCtrl.search: ', azErr, JSON.stringify(azErr,null,2));
        return res.status(500).end();
      });
    }).catch(function(err){ //error handling
      console.log('bookCtrl.search: ', err, JSON.stringify(err,null,2));
      return res.status(500).end();
    });
  },


  //get a book from the amazon api given an isbn
  getAzBookByIsbn: function(req, res){
    var isbn = req.query.isbn;
    amazonCtrl.isbnSearch(isbn).then(function(result){
      return res.send(result);
    }).catch(function(err){
      console.log('getAzBookByIsbn:', err);
      return res.status(500).end();
    });
  },

  //Adds a book given an ISBN and retrieves data from the gooble books API and the Amazon Products API.
  addBookByIsbn: function(req, res) {
    //see if a library was specified to add this book to after its been added to the main book collection:
    var libraryAdd = false;
    if (req.query.libraryId){
      libraryAdd = true;
    }

    var newBook = new Book(req.body); //req.body should be {isbn: <isbn number>}
    newBook.isbn = filterString(newBook.isbn, '-'); //Often ISBNs have dashes inserted for readability, so we need to strip those out
    var goodIsbn = checkIsbn(newBook.isbn); //check if the isbn meets the validity critera

    //make sure this is not a duplicate:
    Book.findOne({$or:[{'isbn10' : newBook.isbn}, {'isbn13' : newBook.isbn}, {'isbn' : newBook.isbn}]}).exec()
    .then(function(foundBook){
      if(!foundBook){
        if (goodIsbn){
          googBooksCtrl.updateFromGoogleBooks(newBook) //update properties form the Google Books API
          .then(function(book){
            return openLibraryCtrl.updateFromOpenLibrary(book); //get book data from Open Library
          }).then(function(book){
            return amazonCtrl.updateFromAmazon(book); //call the amazon products api and update the book with the data returned
          }).then(function(book){
            return book.save(); //save the book
          }).then(function(book) {
            //if we are also going to add this book to a user's library: (depends on if there was a query string on req)
            if(libraryAdd){
              //set up the request object to pass to libraryCtrl.addBookToLibrary() in the format it expects (/api/library/:id/add?bookId=1234567890abc):
              req.params.id = req.query.libraryId;
              req.query.bookId = book._id;
              libraryCtrl.addBookToLibrary(req, res);
            }
            return res.status(201).end(); //good to go
          }).catch(function(err){
            console.log('bookCtrl.addBookByIsbn error: ', err);
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


  // this is the old ugly version. leaving this here for now in case the cleaned up one above breaks something
  // //Adds a book given an ISBN and retrieves data from the gooble books API and the Amazon Products API.
  // addBookByIsbn: function(req, res) {
  //   //see if a library was specified to add this book to after its been added to the main book collection:
  //   var libraryAdd = false;
  //   if (req.query.libraryId){
  //     libraryAdd = true;
  //   }
  //
  //   var newBook = new Book(req.body); //req.body should be {isbn: <isbn number>}
  //   newBook.isbn = filterString(newBook.isbn, '-'); //Often ISBNs have dashes inserted for readability, so we need to strip those out
  //   var goodIsbn = checkIsbn(newBook.isbn); //check if the isbn meets the validity critera
  //
  //   // (this could be cleaned up. need to go back and properly chain .then()s so its less callback-hellish)
  //   //make sure this is not a duplicate:
  //   Book.findOne({$or:[{'isbn10' : newBook.isbn}, {'isbn13' : newBook.isbn}, {'isbn' : newBook.isbn}]}).exec()
  //   .then(function(foundBook){
  //     if(!foundBook){
  //       if (goodIsbn){
  //       //if (newBook.isbn.length >= 9 && !isNaN(newBook.isbn)){
  //         googBooksCtrl.updateFromGoogleBooks(newBook).then(function(book){ //update properties form the Google Books API
  //           newBook = book; //assign the book with the gathered google books info to the new book
  //           openLibraryCtrl.updateFromOpenLibrary(newBook).then(function(olBook){
  //             newBook = olBook;
  //             amazonCtrl.updateFromAmazon(newBook).then(function(azBook){ //call the amazon products api and update the book with the data returned
  //               newBook = azBook;
  //               newBook.save().then(function(theBook) { //save the book
  //                 //console.log(theBook.title, theBook.isbn, 'added to book collection with id:', theBook._id);
  //
  //                 //if we are also going to add this book to a user's library:
  //                 if(libraryAdd){
  //                   //set up the request object to pass to libraryCtrl.addBookToLibrary() in the format it expects (/api/library/:id/add?bookId=1234567890abc):
  //                   req.params.id = req.query.libraryId;
  //                   req.query.bookId = theBook._id;
  //
  //                   libraryCtrl.addBookToLibrary(req, res);
  //                 }
  //                 return res.status(201).end(); //good to go
  //
  //               //error handling:
  //               }).catch(function(err){
  //                 console.log('bookCtrl.addBookByIsbn: Could not save book after returning both updates', err);
  //                 return res.status(500).end();
  //               });
  //             }).catch(function(err) {
  //               newBook.save();
  //               console.log('bookCtrl.addBookByIsbn: updateFromAmazon(newBook)', err, JSON.stringify(err,null,2));
  //               return res.status(500).json(err);
  //             });
  //           }).catch(function(err) {
  //             newBook.save();
  //             console.log('bookCtrl.addBookByIsbn: updateFromOpenLibrary(newBook)', err, JSON.stringify(err,null,2));
  //             return res.status(500).json(err);
  //           });
  //         }).catch(function(err){
  //           console.log('bookCtrl.addBookByIsbn: updateFromGoogleBooks(newBook)', err, JSON.stringify(err,null,2));
  //         });
  //       }else{
  //         //if the ISBN is invalid then return an error code
  //         console.log('bad ISBN:', newBook.isbn);
  //         return res.status(400).json();
  //       }
  //     }else { //if that ISBN already exists in our book roster:
  //       {
  //         console.log('Book already exists! ._id:', foundBook._id, 'ISBN:', foundBook.isbn10, '/', foundBook.isbn13);
  //         return res.status(409).json({error: "Book already exists!"});
  //       }
  //     }
  //   });
  // },

  //this really should only be used for debugging and admin purposes
  getAllBooks:  function(req, res) {
    Book.find(req.query).exec().then(function(docs) {
      return res.json(docs);
    }).catch(function(err) {
      return res.status(400).json(err);
    });
  },

  //returns a book with a matching ISBN, takes a query eg ?isbn=1234567890
  getBook:  function(req, res) {
    var isbn = req.query.isbn;
    //search for the book with this ISBN
    Book.findOne({$or:[{'isbn10' : isbn}, {'isbn13' : isbn}, {'isbn' : isbn}]}).exec()
    .then(function(foundBook){
      if(foundBook){
        return res.json(foundBook); //return it
      }else{
        return res.status(404).end(); //nothing was found
      }
    }).catch(function(err){
      console.log('bookCtrl.getBook error:', err);
    });
  },

  //edits the property on a book, currently not used on the frontend but I'll keep it here in case I need it later
  editBook: function(req, res) {
    Book.findByIdAndUpdate(req.params.id, req.body, {new: true}).exec().then(function(doc) {
      return res.json(doc);
    }).catch(function(err) {
      console.log(err);
      return res.status(400).json(err);
    });
  },

  //deletes a book from the main book collection
  deleteBook: function(req, res) {

    //get the book data for the deletion history
    Book.findById(req.params.id).exec().then(function(book){
      var deletedBook = {
        isbn: book.isbn,
        name: book.title,
      };
      adminCtrl.addDeletedBook(deletedBook);

    }).then(function(){
      Book.findByIdAndRemove(req.params.id, function(err, result){
        if(err){
          res.status(400).json(err);
        } else {
          Library.find({'books.book.bookData': req.params.id}).exec().then(function(docs) {
            //loop through the libraries that contain this book and splice it out of each one: (I feel like there should be a more efficient way to do this, I'll have to revisit this later)
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
    }).catch(function(err){
      console.log(err);
    });
  }

};
