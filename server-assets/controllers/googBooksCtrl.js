var request = require('request-promise'); //http request promises
var q = require('q'); //promises library

//this controller handles requests made to the Google Books API

var googUri = 'https://www.googleapis.com/books/v1/'; //API URI

// get book info by ISBN and return a promise.
// usage ex:
// lookUpIsbn('9780300119794')
//   .then(function(body){
//     var result = JSON.parse(body); //body is the json result, parse it to use it as an object
//   }).catch(function(err){
//     console.log('error:', err) //uh oh :(
//   });
function lookUpIsbn(isbn){
  return request({
    method: 'GET',
    uri: googUri+'volumes?q=isbn:'+isbn, //eg, https://www.googleapis.com/books/v1/volumes?q=isbn:1416590870
  },
  function(err, res, body){
    if (res.statusCode !== 200){
      console.log('*** googBooksCtrl.lookUpIsbn:',this.method,'request for', this.uri.href, 'returned status code:', res.statusCode);
    }
  });
}

module.exports = {

  //takes a book object, and then updates its properties with data from the Google Books API based on the book's ISBN and then returns a promise
  updateFromGoogleBooks: function(book){
    return q.Promise(function(resolve, reject){
      lookUpIsbn(book.isbn)
      .then(function(body){
        queryObj = JSON.parse(body); //an object of the results from our query
        if (queryObj.totalItems > 0){
          var i = 0; //for now we'll just go with the first hit if it returns more than one result, thus [0]. Maybe I'll change this later to handle multiple results if it becomes necessary

          if (queryObj.items[i].accessInfo){
            if (queryObj.items[i].accessInfo.webReaderLink) book.googBooksUrl = queryObj.items[i].accessInfo.webReaderLink;
          }
          if (queryObj.items[i].volumeInfo){
            if (queryObj.items[i].volumeInfo.title) book.title = queryObj.items[i].volumeInfo.title;
            if (queryObj.items[i].volumeInfo.subtitle) book.subtitle = queryObj.items[i].volumeInfo.subtitle;
            if (queryObj.items[i].volumeInfo.authors) book.authors = queryObj.items[i].volumeInfo.authors;
            if (queryObj.items[i].volumeInfo.publishedDate) book.publishDate = queryObj.items[i].volumeInfo.publishedDate;
            if (queryObj.items[i].volumeInfo.publisher) book.publisher = queryObj.items[i].volumeInfo.publisher;
            if (queryObj.items[i].volumeInfo.description) book.googDescription = queryObj.items[i].volumeInfo.description;
            if (queryObj.items[i].volumeInfo.pageCount) book.length = queryObj.items[i].volumeInfo.pageCount;
            if (queryObj.items[i].volumeInfo.language) book.lang = queryObj.items[i].volumeInfo.language;
            if (queryObj.items[i].volumeInfo.categories) book.tags = queryObj.items[i].volumeInfo.categories;

            if (queryObj.items[i].volumeInfo.imageLinks){
              if (queryObj.items[i].volumeInfo.imageLinks.thumbnail) book.coverArtUrl.large = queryObj.items[i].volumeInfo.imageLinks.thumbnail;
            }
            //get alternate ISBNs:
            if (queryObj.items[i].volumeInfo.industryIdentifiers){
              for (var j = 0; j < queryObj.items[i].volumeInfo.industryIdentifiers.length; j++){
                if (queryObj.items[i].volumeInfo.industryIdentifiers[j].type === "ISBN_13"){
                  book.isbn13 = queryObj.items[i].volumeInfo.industryIdentifiers[j].identifier;
                }
                if (queryObj.items[i].volumeInfo.industryIdentifiers[j].type === "ISBN_10"){
                  book.isbn10 = queryObj.items[i].volumeInfo.industryIdentifiers[j].identifier;
                }
              }
            }
          }
        }
        resolve(book); //return the updated book
      }).catch(function(err){
        console.log('updateFromGoogleBooks error', err);
         reject(book); //something bad happened
      });
    });
  },

};
