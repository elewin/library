angular.module('library').controller('mainCtrl', function($scope, bookService, userService, $q) {

  var getCurrentUser = function(){
    return $q(function(resolve, reject) {
      var currentUser = userService.getCurrentUser();
      resolve(currentUser);
    });
  };

  getCurrentUser().then(function(user){
    $scope.currentUser = user;
  });


});
