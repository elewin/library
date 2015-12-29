var request = require('request-promise'); //http request promises
var q = require('q'); //promises library

//this controller handles requests made to the Open Library API

var openLibUri = 'https://openlibrary.org/api/'; //API URI

//looks up an isbn, and returns a promise to a json response:
 function lookUpIsbn(isbn){
  isbn = isbn.toUpperCase(); // the Open Library API does not like lower case 'x' in an ISBN if there is one, so we need to conver it to upper case if an ISBN with a lower case x was passed in
  return request({
    method: 'GET',
    uri: openLibUri+'books?&jscmd=details&format=json&bibkeys=ISBN:'+isbn, //eg https://openlibrary.org/api/books?&jscmd=details&format=json&bibkeys=ISBN:080652569X
  },
  function(err, res, body){
    if (res.statusCode !== 200){
      console.log('openLibraryCtrl.lookUpIsbn: GET requset for', isbn, 'returned', res.statusCode);
      console.log('Error message:', err);
    }
  });
}

// given an object, test if the object is empty and returns a bool
function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)){
      return false;
    }
  }
  return true;
}

module.exports = {

  //given a book object, this will update its properties using the json response from lookUpIsbn() and return a promise
  updateFromOpenLibrary: function(book){
    return q.Promise(function(resolve, reject){
      lookUpIsbn(book.isbn)
      .then(function(body){
        var queryObj = JSON.parse(body); //parse the results into an object
        if (isEmpty(queryObj)){
          resolve(book); //if the Open Library search produced no results, just pass the book along as we got it
        }else{

          var objKey = Object.getOwnPropertyNames(queryObj); //Open Library returns results wrapped in a key that is in the format "ISBN:<isbn number>", so here we retrieve that key so we can access properties within it
          var result = queryObj[objKey[0]]; //this will make result point to queryObj.ISBN:12345 etc

          if (result.details){
            if (result.details.number_of_pages) book.length = result.details.number_of_pages.toString();
            if (result.details.subtitle) book.subtitle = result.details.subtitle;
            if (result.details.subjects){
              for (var i = 0; i < result.details.subjects.length; i++){
                if (book.tags.indexOf(result.details.subjects[i]) === -1){ //make sure we're not adding a duplicate
                  book.tags.push(result.details.subjects[i]); //add subjects to tags array
                }
              }
            }
            if (result.details.publish_places){
              for (var j = 0; j < result.details.publish_places.length; j++){
                book.tags.push(result.details.publish_places[j]);
              }
            }
            if (result.details.description) book.olDescription = result.details.description;
            if (result.details.publishers) book.publisher = result.details.publishers[0];
            if (result.details.publish_places) book.publishPlaces = result.details.publish_places;
            if (result.details.copyright_date) book.copyrightDate = result.details.copyright_date;
            if (result.details.isbn_13) book.isbn13 = result.details.isbn_13[0];
            if (result.details.isbn_10) book.isbn10 = result.details.isbn_10[0];



          }
          resolve(book); //send the updated book back
        }
      }).catch(function(err){ //error handling
        console.log('openLibraryCtrl.updateFromOpenLibrary error: ', err);
        reject(book);
      });
    });
  },

};
