angular.module('library').controller('mainCtrl', function($scope, bookService) {

  bookService.getBooks().then(function (books){
    $scope.books = books.data;
  });
});
