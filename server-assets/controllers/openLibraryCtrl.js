var request = require('request-promise'); //http request promises
var q = require('q'); //promises library

//this controller handles requests made to the Open Library API

var openLibUri = 'https://openlibrary.org/api/'; //API URI

//looks up an isbn, and returns a promise to a json response:
 function lookUpIsbn(isbn){
  isbn = isbn.toUpperCase(); // the Open Library API does not like lower case 'x' in an ISBN if there is one, so we need to conver it to upper case if an ISBN with a lower case x was passed in
  return request({
    method: 'GET',
    uri: openLibUri+'books?&jscmd=data&format=json&bibkeys=ISBN:'+isbn, //eg https://openlibrary.org/api/books?&jscmd=data&format=json&bibkeys=ISBN:080652569X
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

            if (result.number_of_pages) book.length = result.number_of_pages.toString();
            if (result.title) book.title = result.title;
            if (result.subtitle) book.subtitle = result.subtitle;

            //so adding subjects can be a little tricky. First, Open Library likes to add a bunch of weird stuff specific to their site, so we need to filter that out. Also, ng-repeat will break if there are duplicates, so we need to watch for those as well. Also be mindful that we add subject_places as tags so those need to be checked for duplicates too (ISBN 0307266931 is a good example of this)
            var tagsArr = [];
            if (result.subjects){
              for (var i = 0; i < result.subjects.length; i++){
                 //filter out weird Open Library stuff:
                if (result.subjects[i].name.toLowerCase().indexOf('protected daisy') === -1 &&
                result.subjects[i].name.toLowerCase().indexOf('in library') === -1 &&
                result.subjects[i].name.toLowerCase().indexOf('nyt:') === -1 &&
                result.subjects[i].name.toLowerCase().indexOf('accessible book') === -1 &&
                result.subjects[i].name.toLowerCase().indexOf('disabled book') === -1 &&
                result.subjects[i].name.toLowerCase().indexOf('lending library') === -1 &&
                book.tags.indexOf(result.subjects[i].name) === -1 ){  //make sure we're not adding a duplicate
                  book.tags.push(result.subjects[i].name); //add subjects to tags array
                }
              }
            }
            if (result.subject_places){
              for (var j = 0; j < result.subject_places.length; j++){
                //check for duplicates:
                if(book.tags.indexOf(result.subject_places[j].name) === -1){
                  book.tags.push(result.subject_places[j].name);
                }
              }
            }
            if (result.publishers) book.publisher = result.publishers[0];
            if (result.publish_places){
              for(var k = 0; k < result.publish_places.length; k++){
                //check for duplicates:
                if(book.publishPlaces.indexOf(result.publish_places[k].name) === -1){
                  book.publishPlaces.push(result.publish_places[k].name);
                }
              }
            }
            if (result.identifiers){
              if (result.identifiers.isbn_13) book.isbn13 = result.identifiers.isbn_13[0];
              if (result.identifiers.isbn_10) book.isbn10 = result.identifiers.isbn_10[0];
            }
            if (result.classifications){
              if (result.classifications.dewey_decimal_class) book.dewyDec = result.classifications.dewey_decimal_class;
              if (result.classifications.lc_classifications) book.lcClass = result.classifications.lc_classifications;
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
