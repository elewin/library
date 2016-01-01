angular.module('library').controller('bookPageCtrl', function($scope, bookService, userService, libraryService, bookRef, userRef, $state) {

  $scope.book = bookRef.data;
  $scope.currentUser = userRef;

  //check if there is a logged in user, if so get put the following on scope:
  userService.isUserLoggedIn().then(function(user){
    if(user){
      //check if the user has this book in his/her library, and put the result on scope (result.data is a bool)
      libraryService.doesUserHaveBook(userRef.library, bookRef.data.isbn).then(function(result){
        $scope.doesUserHaveBook = result.data; //bool if they have the book or not

        //if the user has this book in their library, get that book entry from the book array in their library:
        if(result.data){
          libraryService.getBookFromLibrary(userRef.library, bookRef.data._id).then(function(book){
            $scope.userBook = book.data; //the book from the user's book library, including their own personal info (own, read, notes, etc)            
          });
        }
      });
    }
  });

  //tag handling:
  var tagThreshold = 3; //how many tags we'll display before making it expandable/collapsable (some books have a lot)
  $scope.tagsLimited = []; //if the number of tags exceeds the nubmer set in tagThreshold, this will be an array containing the first n number of tags in the tags array, where n is the number defined in tagThreshold
  $scope.tagsRemainder = []; //this will be an array containing the rest of the tags, this way they can be hidden from the user until they click something to reduce screen clutter
  if (bookRef.data.tags.length > tagThreshold){
    for (var i = 0; i < tagThreshold; i++){
      $scope.tagsLimited.push(bookRef.data.tags[i]);
    }
    for (i = tagThreshold; i < bookRef.data.tags.length; i++){
      $scope.tagsRemainder.push(bookRef.data.tags[i]); //push the remainder of the tags
    }
  }

  //the average rating for this book
  if(bookRef.data.numReviews >0){
    $scope.avgRating = bookRef.data.totalScore/bookRef.data.numReviews;
  }else $scope.avgRating = 0;

  $scope.statusOptions = [
    {
      name: 'Read',
      value: 'read',
    },
    {
      name: 'Unread',
      value: 'unread',
    },
    {
      name: 'Reading',
      value: 'reading',
    },
  ];


  $scope.deleteBook = function(id){
    bookService.deleteBook(id).then(function(res){
      console.log('deleting book',id);
      $state.go('main.home');
    });
  };

  $scope.addToLibraryByBookId = function(libraryId, bookId){
    libraryService.addToLibraryByBookId(libraryId, bookId).then(function(res){
      $state.go($state.current, {}, {reload: true}); //refresh page
    });

  };

  $scope.removeFromLibrary = function(libraryId, bookId){
    libraryService.removeFromLibrary(libraryId, bookId).then(function(res){
      $state.go($state.current, {}, {reload: true}); //refresh page
    });
  };


});
