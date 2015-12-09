var request = require('request-promise');

//this controller handles requests made to the Google Books API

var googUri = 'https://www.googleapis.com/books/v1/'; //API URI

module.exports = {


  lookUpIsbn: function(isbn){
    // get book info by ISBN and return a promise. usage ex:
    // requestCtrl.lookUpIsbn('1416590870')
    //   .then(function(body){
    //     var result = JSON.parse(body); //body is the json result
    //   }).catch(function(err){
    //     console.log('error:', err)
    //   });
    return request({
      method: 'GET',
      uri: googUri+'volumes?q=isbn:'+isbn, //eg, https://www.googleapis.com/books/v1/volumes?q=isbn:1416590870
    },
    function(err, res, body){
      if (!err && res.statusCode !== 200){
        console.log('*** requestCtrl.lookUpIsbn:',this.method,'request for', this.uri.href, 'returned status code:', res.statusCode);
      };
    });
  },

  //take a book object, and then updates its properties with data from the Google Books API based on the book's ISBN and returns the updated object
  updateFromGoogleBooks: function(book){
    module.exports.lookUpIsbn(book.isbn)
      .then(function(body){
        obj = JSON.parse(body);
        console.log(obj.totalItems);
        console.log(obj.items[0].volumeInfo.title);
      });

  },


};
