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

//strips HTML out of a string. This will break things if a string has a '<' that is not part of an HTML tag though! Basically it just rebuilds the string and ignores everything after a '<' until it sees a '>'. It is very simple but should work for our purposes.
function stripHtml(str){
  var filteredStr = '';
  var ignore = false;
  for (var i = 0; i < str.length; i++){
    if (str[i] === '<'){ //if this is the start of an HTML tag, turn the filter on and ignore these characters
      ignore = true;
    }
    if (!ignore){
      filteredStr += str[i]; //if we are not inside an HTML tag, let the character pass the filter
    }
    if (str[i] === '>'){ //if we are at the end of an HTML tag, turn the filter back off
      ignore = false;
    }
  }
  return filteredStr;
}

module.exports = {

  //returns a promise that resolves the results of a book search based on the given serach paramater and search term
  searchForBook : function(searchParams){
    //searchParams is an object containing the type of search to be done (param) and the term to search for (term): eg, { param: 'title', term: 'the iliad' }
    //param can be: author, title, keywords (see http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html)
    var deferred = q.defer();

    //set up fixed search paramaters here:
    var searchObj = {
      searchIndex : 'Books',
      responseGroup : 'ItemAttributes,Images,EditorialReview',
      Sort : 'relevancerank',
    };
    //add the search parameters that were passed in:
    searchObj[searchParams.param] = searchParams.term;

    client.itemSearch(searchObj).then(function(results){ //search for results based on searchObj
      deferred.resolve(results); //results is an array of objects from the amazon api
    }).catch(function(err){
      if(err.Error[0].Code[0] === 'AWS.ECommerceService.NoExactMatches'){ //if nothing was found, the API will return this code
        deferred.resolve(false); //return a false so we can elsewhere determine that there were no results
      }else {
        console.log('amazonCtrl.searchForBook error: ', err, JSON.stringify(err,null,2));
        deferred.reject(err);
      }
    });
    return deferred.promise;
  },

  //get a from the amazon products api given an ISBN, returns a promise
  isbnSearch: function(isbn){
    var deferred = q.defer();

    client.itemLookup({
      idType: 'ISBN',
      itemId: isbn,
      responseGroup: 'ItemAttributes,Images,EditorialReview'
    }).then(function(results) {
      deferred.resolve(results);
    }).catch(function(err){
      console.log('amazonCtrl.isbnSearch error:', err);
      deferred.reject();
    });
    return deferred.promise;

  },

  //takes a book object (that should have already been processed by the google books API) and updates its properties with data from the Amazon Products API and returns a promise
  updateFromAmazon : function(book){
    return q.Promise(function(resolve, reject){
      var i = 0; //in a future version I may add support for multiple results. for now we will just use the first result. However, in testing (so far) it appears that pretty much all results just have one element anyway
      client.itemLookup({
        idType: 'ISBN',
        itemId: book.isbn,
        responseGroup: 'ItemAttributes,Images,EditorialReview'
      }).then(function(results) {

      //special case handling if the result from google books did not contain an ISBN10 or ISBN13 identifier, inwhich case we will just apply the ISBN we do have to whatever seems to fit:
        var isbnLength = book.isbn.length;
        if(book.isbn10 === 'None' && (isbnLength === 9 || isbnLength === 10)){
          book.isbn10 = book.isbn;
        }
        else{
          if(book.isbn13 === 'None' && isbnLength === 13){
            book.isbn13 = book.isbn;
          }
        }

        //the amazon api likes to wrap everything in arrays, but in testing i've yet to encounter anything with more than one element (aside from EditorialReviews), thus all the [0]s hardcoded in here. This can be changed later to iterate through everything if that turns out to be a problem. One side effect of this is that we have to test that the results actually returned an element for everything (thus all the if statements), or else we'll get errors saying that it cannot read property 0 of undefined

        if(results[i].ItemAttributes){
          if (book.subtitle === ''){ //amazon likes to combine title and subtitle, we'll keep the google books title unless there's no subtitle present
            if (results[i].ItemAttributes[0].Title) book.title = results[i].ItemAttributes[0].Title[0];
          }

          if (results[i].ItemAttributes[0].Author) book.authors = results[i].ItemAttributes[0].Author;
          if (results[i].ItemAttributes[0].Edition) book.edition = results[i].ItemAttributes[0].Edition[0];
          if (results[i].ItemAttributes[0].PublicationDate) book.publishDate = results[i].ItemAttributes[0].PublicationDate[0];
          if (results[i].ItemAttributes[0].Publisher)book.publisher = results[i].ItemAttributes[0].Publisher[0];
          if (results[i].ItemAttributes[0].NumberOfPages) book.length = results[i].ItemAttributes[0].NumberOfPages[0];
          if (results[i].ItemAttributes[0].Languages){
            if (results[i].ItemAttributes[0].Languages[0].Language){
              if (results[i].ItemAttributes[0].Languages[0].Language[0].Name) book.lang =  results[i].ItemAttributes[0].Languages[0].Language[0].Name[0];
            }
          }

          // I've yet to see a book search result return anything with the genre attribute, so I haven't been able to test it.
          // if (results[i].ItemAttributes[0].Genre){
          //   for (var j = 0; j < results[i].ItemAttributes[0].Genre.length; j++){
          //     if (book.tags.indexOf(results[i].ItemAttributes[0].Genre[j]) === -1){ //check that this hasn't already been added
          //       book.tags.push(results[i].ItemAttributes[0].Genre[j]);
          //     }
          //   }
          // }
        }
        if(results[i].EditorialReviews){
          if (results[i].EditorialReviews[0].EditorialReview){
            for (var k =0; k < results[i].EditorialReviews[0].EditorialReview.length; k++){
              if (results[i].EditorialReviews[0].EditorialReview[k].Content){
                if (results[i].EditorialReviews[0].EditorialReview[k].Content[0] !== book.googDescription){ //dont copy descriptions that are duplicates of the goolge books provided description
                  //dont copy amazon duplicates either:
                  if (book.azDescription.indexOf(stripHtml(results[i].EditorialReviews[0].EditorialReview[k].Content[0])) === -1){
                    book.azDescription.push(stripHtml(results[i].EditorialReviews[0].EditorialReview[k].Content[0])); //amazon's descriptions often have HTML in them, so here we strip them out with our stripHtml() function
                  }
                }
              }
            }
          }
        }
        if (results[i].LargeImage) book.coverArtUrl.large = results[i].LargeImage[0].URL[0];
        if (results[i].MediumImage) book.coverArtUrl.medium = results[i].MediumImage[0].URL[0];
        if (results[i].SmallImage) book.coverArtUrl.small = results[i].SmallImage[0].URL[0];

        if (results[i].DetailPageURL) book.amazonUrl = results[i].DetailPageURL[0];

        resolve(book);
      }).catch(function(err) {
        console.log('amazonCtrl.updateFromAmazon: ', err, JSON.stringify(err, null,2));
        reject(book);
      });

    });

  }

};
