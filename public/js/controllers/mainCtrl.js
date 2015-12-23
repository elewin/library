angular.module('library').controller('mainCtrl', function($scope, bookService, userService, $q) {

  var getCurrentUser = function(){
    return $q(function(resolve, reject) {
      var currentUser = userService.getCurrentUser();
      resolve(currentUser);
    });
  };

  userService.isUserLoggedIn().then(function(result){ //check if a user is logged in
    if(result){
      getCurrentUser().then(function(user){
        $scope.currentUser = user;  //if so, put them on scope
      });
    }
  });

});
