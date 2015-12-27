//var mongoose = require('mongoose');
var Book = require('../models/bookSchema');
var Library = require('../models/librarySchema');
var libraryCtrl = require('./libraryCtrl');
var googBooksCtrl = require('./googBooksCtrl');
var amazonCtrl = require('./amazonCtrl');
var q = require('q'); //promises library

//tests if a given isbn number meets certain validity critera and returns a bool
function checkIsbn(isbn){
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

  //if we are searching for the title or author, search just those fields
  if(searchParam === 'author'){
    searchObj.author = {
      "$regex": searchTerm,
      "$options": "i"
    };
  }
  //if this is a title search, search both title and subtitle
  if (searchParam ==='title'){
    searchObj = {
      $or:[
        {
        title: {
          "$regex": searchTerm,
          "$options": "i"
          }
        },
        {
        subtitle: {
          "$regex": searchTerm,
          "$options": "i"
          }
        },
      ]
    };
  }

  //this is a more expensive search, it searches through the title, subtitle, author, description, and tags fields (all of which should be indexed however)
  if(searchParam === 'keywords'){
    searchObj = {
      $or:[
        {
          title: {
            "$regex": searchTerm,
            "$options": "i"
          }
        },
        {
        author: {
          "$regex": searchTerm,
          "$options": "i"
          }
        },
        {
        googDescription: {
          "$regex": searchTerm,
          "$options": "i"
          }
        },
        {
        azDescription: {
          "$regex": searchTerm,
          "$options": "i"
          }
        },
        {
        tags: {
          "$regex": searchTerm,
          "$options": "i"
          }
        },
        {
        subtitle: {
          "$regex": searchTerm,
          "$options": "i"
          }
        },
      ]
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

  //searches the Amazon Products API for the book given the paramters in req.query
  azSearchForBook: function(req, res){
    amazonCtrl.searchForBook(req.query).then(function(results){
      return res.json(results);
    }).catch(function(err){
      if (err[0].Error[0].Code[0] === 'AWS.ECommerceService.NoExactMatches'){ //this is what returns if nothing is found
        console.log('Amazon: ',err[0].Error[0].Message[0]);
        return res.status(404).end();
      }
      else{
        console.log('bookCtrl.searchAzForBook error on', req.query, 'Error:', JSON.stringify(err,null,2)); //if something else went wrong
        return res.status(500).end();
      }
    });
  },

  //search the db for a book given a search paramater (author, title, keyword) and search term
  dbSearchForBook: function(req, res){
    var searchParams = req.query; //what to search for
    var searchObj = {}; //this object will hold our search query data for the database

    //if we are searching for the title or author, search just those fields
    if(searchParams.param === 'title' || searchParams.param === 'author'){
      searchObj[searchParams.param] = {
        "$regex": searchParams.term,
        "$options": "i"
      };
    }

    //this is a more expensive search, it searches through the title, author, description,and tags fields
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

    Book.find(searchObj).exec().then(function(results){ //search the book collection using the paramters of our searchObj object
      return res.json(results);
    }).catch(function(err){
      console.log(err);
      return res.status(400).send(err);
    });
  },

  //searches both the database and the amazon products api for a given search term based on a given search paramater (title, author, keyword)
  unifiedSearch: function(req, res){
    var searchParam = req.query.param; //our search paramater
    var searchTerm = req.query.term;   //our search term
    var isbnArr = []; // this will be an array of ISBNs of the hits returned from our db search, so that we can filter out duplicates from the amazon search

    //the Amazon API freaks out if an apostrophe is in the search term, so we need to filter those out. Here we just rebuild the string wtithout them:
    var filtered ='';
    for (var k = 0; k < searchTerm.length; k++){
      if (searchTerm[k] !== "'"){
        filtered += searchTerm[k];
      }
    }
    searchTerm = filtered;

    //search our books collection
    dbSearch(searchParam, searchTerm).then(function(dbSearchResult){
      for (var j = 0; j < dbSearchResult.length; j++){
        //add these ISBNs to our isbnArr to compare against after we get the reuslts back from the amazon api search
        if (dbSearchResult[j].isbn13 !== 'None'){
          isbnArr.push(dbSearchResult[j].isbn13);
        }
        if (dbSearchResult[j].isbn10 !== 'None'){
          isbnArr.push(dbSearchResult[j].isbn10);
        }

      }
      return dbSearchResult;
    }).then(function(dbSearchResult){
      //search the amazon api
      azSearch(searchParam, searchTerm).then(function(azSearchResult){

        //clean up data:
        var arrLength = azSearchResult.length;
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

        //now that the data is cleaned up and we have filtered out duplicates, lets build our final results object:
        var azCount = azSearchResult.length;
        var dbCount = dbSearchResult.length;
        var unifiedResult = {
          db : dbSearchResult,
          dbCount: dbCount,
          az: azSearchResult,
          azCount: azCount,
          total:  dbCount+azCount,
        };

        return res.json(unifiedResult); //return the result

      }).catch(function(azErr){ //error handling for amazon search
        console.log('bookCtrl.unifiedSearch: ', JSON.stringify(azErr,null,2));
        return res.status(500).end();
      });
    }).catch(function(err){ //error handling
      console.log('bookCtrl.unifiedSearch: ', JSON.stringify(err,null,2));
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
                console.log(theBook.title, theBook.isbn, 'added to book collection with id:', theBook._id);

                //if we are also going to add this book to a user's library:
                if(libraryAdd){
                  //set up the request object to pass to libraryCtrl.addBookToLibrary() in the format it expects (/api/library/:id/add?bookId=1234567890abc):
                  var reqObj = {
                    params: {
                      id: req.query.libraryId //the libraryId
                    },
                    query: {
                      bookId: theBook._id //the _id of the book we just created
                    }
                  };
                  libraryCtrl.addBookToLibrary(reqObj, res);
                }

                return res.status(201).end();
              });
            }).catch(function(err) {
              newBook.save();
              console.log('bookCtrl.addBookByIsbn: updateFromAmazon(newBook)', err, JSON.stringify(err,null,2));
              return res.status(500).json(err);
            });
          }).catch(function(err){
            console.log('bookCtrl.addBookByIsbn: updateFromGoogleBooks(newBook)', err, JSON.stringify(err,null,2));
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
