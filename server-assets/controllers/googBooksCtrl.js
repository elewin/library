var request = require('request-promise');
var q = require('q');

//this controller handles requests made to the Google Books API

var googUri = 'https://www.googleapis.com/books/v1/'; //API URI

module.exports = {

  // get book info by ISBN and return a promise.
  // usage ex:
  // googBooksCtrl.lookUpIsbn('9780300119794')
  //   .then(function(body){
  //     var result = JSON.parse(body); //body is the json result, parse it to use it as an object
  //   }).catch(function(err){
  //     console.log('error:', err) //uh oh :(
  //   });
  lookUpIsbn: function(isbn){
    return request({
      method: 'GET',
      uri: googUri+'volumes?q=isbn:'+isbn, //eg, https://www.googleapis.com/books/v1/volumes?q=isbn:1416590870
    },
    function(err, res, body){
      if (res.statusCode !== 200){
        console.log('*** googBooksCtrl.lookUpIsbn:',this.method,'request for', this.uri.href, 'returned status code:', res.statusCode);
      };
    });
  },

  //takes a book object, and then updates its properties with data from the Google Books API based on the book's ISBN and then returns a promise
  updateFromGoogleBooks: function(book){
    return q.Promise(function(resolve, reject){
      module.exports.lookUpIsbn(book.isbn)
      .then(function(body){
        queryObj = JSON.parse(body); //an object of the results from our query
        if (queryObj.totalItems > 0){
          var i = 0; //for now we'll just go with the first hit if it returns more than one result, thus [0]. Maybe I'll change this later to handle multiple results if it becomes necessary
          book.title = queryObj.items[i].volumeInfo.title;
          book.subtitle = queryObj.items[i].volumeInfo.subtitle;
          book.author = queryObj.items[i].volumeInfo.authors[0]; //later i will make book.authors an array but for now its a string, so ill just grab the first one
          book.date = queryObj.items[i].volumeInfo.publishedDate;
          book.publisher = queryObj.items[i].volumeInfo.publisher;
          book.description = queryObj.items[i].volumeInfo.description;
          book.length = queryObj.items[i].volumeInfo.pageCount;
          book.lang = queryObj.items[i].volumeInfo.language;
          book.tags = queryObj.items[i].volumeInfo.categories;
          book.coverArtUrl = queryObj.items[i].volumeInfo.imageLinks.thumbnail;
          book.googBooksUrl = queryObj.items[i].selfLink;
        }
        resolve(book); //return the updated book
      }).catch(function(err){
        console.log('updateFromGoogleBooks error');
         reject(book); //something bad happened
      });
    });
  },

};
