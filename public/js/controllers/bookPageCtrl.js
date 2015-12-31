angular.module('library').controller('bookPageCtrl', function($scope, bookService, libraryService, bookRef, userRef, $state) {

  $scope.book = bookRef.data;
  $scope.currentUser = userRef;

  //the average rating for this book
  if(bookRef.data.numReviews >0){
    $scope.avgRating = bookRef.data.totalScore/bookRef.data.numReviews;
  }else $scope.avgRating = 0;


  //check if the user has this book in his/her library, and put the result on scope (returns a bool)
  libraryService.doesUserHaveBook(userRef.library, bookRef.data.isbn).then(function(result){
    $scope.doesUserHaveBook = result.data;
  });

  $scope.deleteBook = function(id){
    bookService.deleteBook(id).then(function(res){
      console.log('deleting book',id);
    });
  };

  $scope.addToLibraryByBookId = function(libraryId, bookId){
    libraryService.addToLibraryByBookId(libraryId, bookId).then(function(res){
      $state.go($state.current, {}, {reload: true}); //refresh page
    });

  };

  $scope.removeFromLibrary = function(libraryId, bookId){
    libraryService.removeFromLibrary(libraryId, bookId).then(function(res){
      $state.go($state.current, {}, {reload: true}); //refresh page
    });

  };


});
