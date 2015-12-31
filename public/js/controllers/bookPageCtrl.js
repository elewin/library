angular.module('library').controller('bookPageCtrl', function($scope, bookService, userService, libraryService, bookRef) {

  $scope.book = bookRef.data;

  $scope.deleteBook = function(id){
    bookService.deleteBook(id).then(function(res){
      console.log('deleting book',id);
    });
  };

});
