angular.module('library').controller('mainCtrl', function($scope, bookService, userService, $q, $state, userRef) {

  $scope.$state = $state;
  $scope.currentUser = userRef;

  // this is obsolete now that we're injecting userRef
  // var getCurrentUser = function(){
  //   return $q(function(resolve, reject) {
  //     var currentUser = userService.getCurrentUser();
  //     resolve(currentUser);
  //   });
  // };
  //
  // getCurrentUser().then(function(user){
  //   if (user){
  //     $scope.currentUser = user;  //put the user on scope
  //   }
  // });

  userService.doesUserHaveRole('admin').then(function(result){
    $scope.hasAdminRole = result;
  });

  userService.doesUserHaveRole('user').then(function(result){
    $scope.hasUserRole = result;
  });

  //DEPRECATED
  //old version, from before getCurrentUser() also checked for a logged in user
  // userService.isUserLoggedIn().then(function(result){ //check if a user is logged in
  //   if(result){
  //     getCurrentUser().then(function(user){
  //       $scope.currentUser = user;  //if so, put them on scope
  //     });
  //   }
  // });



});
