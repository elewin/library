angular.module('library').controller('libraryCtrl', function($scope, bookService, libraryService, $q, userRef) {

  //the current user
  $scope.currentUser = userRef;

  //the user's library
  libraryService.getUserLibrary(userRef._id).then(function(library){
    $scope.library = library.data;
    console.log(library.data);
  });

});
