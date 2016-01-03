angular.module('library').controller('bookPreviewPageCtrl', function($scope, userRef, bookRef, $state) {

  $scope.currentUser = userRef;

  $scope.addToLibrary = function(userId, isbn){
    //add combo add fn here
  };

  //here we format the data to mimic the same structure used elsewhere for consistency
  var book = bookRef.data[0];
  $scope.book = {};
  $scope.book.azDescription = [];
  $scope.book.coverArtUrl = {};

  //see /server-assets/amazonCtrl
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

  if(book.ItemAttributes){
    if (book.ItemAttributes[0].ISBN) $scope.book.isbn = book.ItemAttributes[0].ISBN[0];
    if (book.ItemAttributes[0].Title) $scope.book.title = book.ItemAttributes[0].Title[0];
    if (book.ItemAttributes[0].Author) $scope.book.authors = book.ItemAttributes[0].Author;
    if (book.ItemAttributes[0].Edition) $scope.book.edition = book.ItemAttributes[0].Edition[0];
    if (book.ItemAttributes[0].PublicationDate) $scope.book.publishDate = book.ItemAttributes[0].PublicationDate[0];
    if (book.ItemAttributes[0].Publisher) $scope.book.publisher = book.ItemAttributes[0].Publisher[0];
    if (book.ItemAttributes[0].NumberOfPages) $scope.book.length = book.ItemAttributes[0].NumberOfPages[0];
    if (book.ItemAttributes[0].Languages){
      if (book.ItemAttributes[0].Languages[0].Language){
        if (book.ItemAttributes[0].Languages[0].Language[0].Name) $scope.book.lang =  book.ItemAttributes[0].Languages[0].Language[0].Name[0];
      }
    }
  }
  if(book.EditorialReviews){
    if (book.EditorialReviews[0].EditorialReview){
      for (var k =0; k < book.EditorialReviews[0].EditorialReview.length; k++){
        if (book.EditorialReviews[0].EditorialReview[k].Content){
          if (book.EditorialReviews[0].EditorialReview[k].Content[0] !== book.googDescription){ //dont copy descriptions that are duplicates of the goolge books provided description
            //dont copy amazon duplicates either:
            if ($scope.book.azDescription.indexOf(stripHtml(book.EditorialReviews[0].EditorialReview[k].Content[0])) === -1){
              $scope.book.azDescription.push(stripHtml(book.EditorialReviews[0].EditorialReview[k].Content[0])); //amazon's descriptions often have HTML in them, so here we strip them out with our stripHtml() function
            }
          }
        }
      }
    }
  }
  if (book.LargeImage) $scope.book.coverArtUrl.large = book.LargeImage[0].URL[0];
  if (book.MediumImage) $scope.book.coverArtUrl.medium = book.MediumImage[0].URL[0];
  if (book.SmallImage) $scope.book.coverArtUrl.small = book.SmallImage[0].URL[0];

  if (book.DetailPageURL) $scope.book.amazonUrl = book.DetailPageURL[0];

});
