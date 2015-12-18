angular.module('library').directive('booksDir', function(libraryService) {
  return {
    templateUrl: 'js/directives/booksDirTmpl.html',
    scope: {
      user: '=',
      getLibrary: '&',
    },
    controller: function($scope) {
      $scope.getLibrary({id:$scope.user._id}).then(function(library) {
        $scope.userLibrary = library;
      });
      $scope.removeFromLibrary = function(libraryId, bookId){
        libraryService.removeFromLibrary(libraryId, bookId).then(function(res){
          $scope.getLibrary({id:$scope.user._id}).then(function(library) {
            $scope.userLibrary = library;
          });
        });
      };
    }
  };
});
