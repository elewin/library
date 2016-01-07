angular.module('library').controller('mainCtrl', function($scope, bookService, userService, $q, $state, userRef) {

  $scope.$state = $state;
  $scope.currentUser = userRef;


  userService.doesUserHaveRole('admin').then(function(result){
    $scope.hasAdminRole = result;
  });

  userService.doesUserHaveRole('user').then(function(result){
    $scope.hasUserRole = result;
  });

});
