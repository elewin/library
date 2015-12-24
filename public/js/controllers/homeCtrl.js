angular.module('library').controller('homeCtrl', function($scope, bookService, userService, $q) {




  bookService.getBooks().then(function (books){
    $scope.books = books.data;
  });
});
