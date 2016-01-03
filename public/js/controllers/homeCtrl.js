angular.module('library').controller('homeCtrl', function($scope, bookService, userService, $q, userRef) {

 $scope.currentUser = userRef;

  //search paramaters
  $scope.searchBookOptions = [
  	{
  		name: 'Title',
  		value: 'title',
  	},
  	{
  		name: 'Author',
  		value: 'author',
  	},
    {
  		name: 'Keyword  ',
  		value: 'keywords',
  	},
  ];

  $scope.searchForBook = function(searchParam, searchTerm){
    bookService.searchForBook(searchParam, searchTerm).then(function(result){
      $scope.searchResults = result.data;
    });
  };


});
