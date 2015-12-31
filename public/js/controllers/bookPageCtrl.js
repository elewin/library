angular.module('library').controller('bookPageCtrl', function($scope, bookService, libraryService, bookRef, userRef) {

  $scope.book = bookRef.data;
  $scope.currentUser = userRef;

  //check if the user has this book in his/her library, and put the result on scope (returns a bool)
  libraryService.doesUserHaveBook(userRef.library, bookRef.data.isbn).then(function(result){
    $scope.doesUserHaveBook = result.data;
  });

  $scope.deleteBook = function(id){
    bookService.deleteBook(id).then(function(res){
      console.log('deleting book',id);
    });
  };


});
