angular.module('library').controller('bookPageCtrl', function($scope, bookService, userService, libraryService, bookRef) {

  $scope.book = bookRef.data;

});
