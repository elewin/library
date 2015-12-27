var config = require("../../config.js"); // config file
var amazon = require('amazon-product-api');
var q = require('q'); //promises library

//this controller handles requests made to the Amazon Product API

//set up credentials:
var client = amazon.createClient({
  awsId: config.api.amazon.key,
  awsSecret: config.api.amazon.secret,
  awsTag: config.api.amazon.tag,
});

module.exports = {

  //returns a promise that resolves the results of a book search based on the given serach paramater and search term
  searchForBook : function(searchParams){
    //searchParams is an object containing the type of search to be done (param) and the term to search for (term): eg, { param: 'title', term: 'the iliad' }
    //param can be: author, title, keywords (see http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html)

    //set up fixed search paramaters here:
    searchObj = {
      searchIndex : 'Books',
      responseGroup : 'ItemAttributes,Images,EditorialReview',
      Sort : 'relevancerank',
    };
    //add the search parameters that were passed in:
    searchObj[searchParams.param] = searchParams.term;

    var deferred = q.defer();
    client.itemSearch(searchObj).then(function(results){ //search for results based on searchObj
      deferred.resolve(results); //results is an array of objects from the amazon api
    }).catch(function(err){
      console.log('amazonCtrl.searchForBook: ', JSON.stringify(err,null,2));
      deferred.reject(err);
    });
    return deferred.promise;
  },

  //takes a book object and updates its properties with data from the Amazon Products API and returns a promise
  updateFromAmazon : function(book){
    return q.Promise(function(resolve, reject){
      var i = 0; //in a future version I'll add support for multiple results. for now we will just use the first result.
      client.itemLookup({
      idType: 'ISBN',
      itemId: book.isbn,
      responseGroup: 'ItemAttributes,Images,EditorialReview'
      }).then(function(results) {
      //  console.log(JSON.stringify(results[i]));

        if (book.title === ''){ //amazon likes to combine title and subtitle, so stick with the google books title unless its empty
          book.title = results[i].ItemAttributes[0].Title[0];
        }
        book.author = results[i].ItemAttributes[0].Author[0];
        book.date = results[i].ItemAttributes[0].PublicationDate[0];
        book.publisher = results[i].ItemAttributes[0].Publisher[0];
        book.azDescription = results[i].EditorialReviews[0].EditorialReview[0].Content[0];
        book.length = results[i].ItemAttributes[0].NumberOfPages[0];
      //  book.tags = //it doesn't look like amazon provides categories?
        book.coverArtUrl.large = results[i].LargeImage[0].URL[0];
        book.coverArtUrl.medium = results[i].MediumImage[0].URL[0];
        book.coverArtUrl.small = results[i].SmallImage[0].URL[0];
        book.lang =  results[i].ItemAttributes[0].Languages[0].Language[0].Name[0];
        book.amazonUrl = results[i].DetailPageURL[0];

        //special case handling if the result from google books did not contain an ISBN10 or ISBN13 identifier, inwhich case we will just apply the ISBN we do have to whatever seems to fit:
        var isbnLength = book.isbn.length;
        if(book.isbn10 === 'None' && isbnLength === 10){
          book.isbn10 = book.isbn;
        }
        else{
          if(book.isbn13 === 'None' && isbnLength === 13){
            book.isbn13 = book.isbn;
          }
        }

        resolve(book);
      }).catch(function(err) {
        console.log('amazonCtrl.searchForBook: ', JSON.stringify(err, null,2));
        reject(book);
      });

    });

  }

};
