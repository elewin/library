angular.module('library').controller('adminCtrl', function($scope, bookService, userService, libraryService) {

  //books:
  $scope.bookOptions = [ //keys for editBook
		{
			name: 'Title',
			value: 'title',
		},
		{
			name: 'Author',
			value: 'author',
		},
		{
			name: 'ISBN',
			value: 'isbn',
		}
	];

  var getBooks = function(){
    bookService.getBooks().then(function (books){
      $scope.books = books.data;
    });
  };
  getBooks();

  $scope.deleteBook = function(id){
    bookService.deleteBook(id).then(function(res){
      getBooks();
      getLibraryList()
    });
  };

  $scope.addBook = function(title, author, isbn){
    bookService.addBook(title, author, isbn);
    $scope.newBookTitle = "";
    $scope.newBookAuthor = "";
    $scope.newBookIsbn = "";
    getBooks();
    getLibraryList()

  };

  $scope.editBook = function(id, key, val){
    bookService.editBook(id, key, val).then(function(res){
      getBooks();
      getLibraryList()
    });
  };


  //users

  $scope.userOptions = [ //keys for editBook
		{
			name: 'Name',
			value: 'name',
		},
	];

  var getUsers = function(){
    userService.getUsers().then(function (users){
      $scope.users = users.data;
      //console.log($scope.users);
    });
  };
  getUsers();

  $scope.addUser = function(name){
    userService.addUser(name).then(function(res){
      getUsers();
      getLibraryList()
    });
  };

  $scope.deleteUser = function(userId, libraryId){
    libraryService.deleteLibrary(libraryId)
    .then(function(res){
      userService.deleteUser(userId)
    })
    .then(function(res){
      getUsers();
      getLibraryList(); //remove later
    });
  };

  $scope.editUser = function(id, key, val){
    userService.editUser(id, key, val).then(function(res){
      getUsers();
      getLibraryList()
    });
  };

  //library

  $scope.libraryOptions = [ //keys for editLibrary
		{
			name: 'tempThing',
			value: 'tempThing',
		},
	];

  var refreshUserLibrary = function(libraryId){
    libraryService.getUserLibrary(libraryId).then(function(userLibrary){
      $scope.userLibrary = userLibrary.data;
    });
  };

  $scope.getUserLibrary = function(libraryId){
    libraryService.getUserLibrary(libraryId).then(function(userLibrary){
      $scope.userLibrary = userLibrary.data;

    });
  }


  var getLibraryList = function(){
    libraryService.getLibraryList().then(function (libraryList){
      $scope.libraryList = libraryList.data;
      console.log(libraryList.data[0]);
    });
  };
  getLibraryList();

  // var getLibrary = function(id){
  //   libraryService.getLibrary(id).then(function (library){
  //       $scope.library = library.data;
  //   });
  //   console.log($scope.library);
  // };

  // $scope.addLibrary = function(){
  //   libraryService.addLibrary().then(function(res){
  //     //getLibraryList();
  //   });
  // };

  // $scope.addLibraryToUser = function(userId){
  //   libraryService.addLibraryToUser(userId).then(function(res){
  //     //getLibraryList();
  //   });
  // };

  $scope.deleteLibrary = function(id){
    libraryService.deleteLibrary(id).then(function(res){
      getLibraryList();
    });
  };

  $scope.editLibrary = function(id, key, val){
    libraryService.editLibrary(id, key, val).then(function(res){
      //getLibraryList();
      //getLibrary(id);
    });
  };

  $scope.addToLibrary = function(userId, bookId){
    libraryService.addToLibrary(userId, bookId).then(function(res){
      getLibraryList();
    });
  };

  $scope.removeFromLibrary = function(libraryId, bookId){
    libraryService.removeFromLibrary(libraryId, bookId).then(function(res){
      getLibraryList();
    });
  };

});
