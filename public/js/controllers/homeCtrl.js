angular.module('library').controller('homeCtrl', function($scope, bookService, userService, $q) {

  // var getCurrentUser = function(){
  //   return $q(function(resolve, reject) {
  //     var currentUser = userService.getCurrentUser();
  //     resolve(currentUser);
  //   });
  // };
  //
  // getCurrentUser().then(function(user){
  //   $scope.currentUser = user;
  // });

  bookService.getBooks().then(function (books){
    $scope.books = books.data;
  });
});
