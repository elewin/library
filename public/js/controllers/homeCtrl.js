angular.module('library').controller('homeCtrl', function($scope, bookService, userService, $q) {




  bookService.getAllBooks().then(function (books){
    $scope.books = books.data;
  });
});
