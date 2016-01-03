angular.module('library').controller('libraryCtrl', function($scope, bookService, libraryService, $q, userRef) {

  //the current user
  $scope.currentUser = userRef;

  //the user's library
  libraryService.getUserLibrary(userRef._id).then(function(library){
    $scope.library = library.data;

    //gather stats:
    var numOwned = 0;
    var numRead = 0;
    var numUnread = 0;
    var numReading = 0;
    var numRated = 0;
    var numBooks = library.data.books.length;
    for (var i = 0; i < numBooks; i++){
      if ( library.data.books[i].book.own === true) numOwned++;
      if ( library.data.books[i].book.status === 'read') numRead++;
      if ( library.data.books[i].book.status === 'unread') numUnread++;
      if ( library.data.books[i].book.status === 'reading') numReading++;
      if ( library.data.books[i].book.rating > 0) numRated++;
    }
    $scope.numBooks = numBooks;
    $scope.numOwned = numOwned;
    $scope.numRead = numRead;
    $scope.numUnread = numUnread;
    $scope.numReading = numReading;
    $scope.numRated = numRated;
  });

});
