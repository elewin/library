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

  // //for testing
  // searchTest: function(){
  //   client.itemSearch({
  //     director: 'Quentin Tarantino',
  //     actor: 'Samuel L. Jackson',
  //     searchIndex: 'DVD',
  //     audienceRating: 'R',
  //     responseGroup: 'ItemAttributes,Offers,Images'
  //   }).then(function(results){
  //     console.log(results);
  //   }).catch(function(err){
  //     console.log(err);
  //   });
  // },

  //returns a promise that resolves the results of a book search by title
  searchForBook : function(searchParams){
    //params can be author, title, keywords


    //set up search paramaters here: (see http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html)
    searchParams.searchIndex = 'Books';
    searchParams.responseGroup = 'ItemAttributes,Images,EditorialReview';
    searchParams.Sort = 'relevancerank';

    var deferred = q.defer();
    client.itemSearch(searchParams).then(function(results){
      deferred.resolve(results); //results is an array of objects from the amazon api
    }).catch(function(err){
      console.log(err);
      deferred.reject(err);
    });
    return deferred.promise;
  },

  // //for testing
  // searchByIsbn : function(isbn){
  //   client.itemLookup({
  //   idType: 'ISBN',
  //   itemId: isbn,
  //   responseGroup: 'ItemAttributes,Images,EditorialReview'
  //   }).then(function(results) {
  //     console.log(JSON.stringify(results));
  //     // console.log(results[0].ItemAttributes);
  //     // console.log(results[0].ItemAttributes[0].Title[0]);
  //   }).catch(function(err) {
  //     console.log(err);
  //   });
  // },

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
        resolve(book);
      }).catch(function(err) {
        console.log('updateFromAmazon error:', err);
        reject(book);
      });

    });

  }

};
