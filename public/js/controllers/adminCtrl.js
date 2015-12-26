angular.module('library').controller('adminCtrl', function($scope, bookService, userService, libraryService, $q) {

  //books: **************************************************************

  $scope.searchBookOptions = [ //search paramaters
  	{
  		name: 'Title',
  		value: 'title',
  	},
  	{
  		name: 'Author',
  		value: 'author',
  	},
    {
  		name: 'Keyword',
  		value: 'keywords',
  	},

  ];

  //this isn't used anymore
  // $scope.editBookOptions = [ //keys for editBook
	// 	{
	// 		name: 'Title',
	// 		value: 'title',
	// 	},
	// 	{
	// 		name: 'Author',
	// 		value: 'author',
	// 	},
	// 	// {
	// 	// 	name: 'ISBN',
	// 	// 	value: 'isbn',
	// 	// }
	// ];

  //refactor w out $q?
  var getCurrentUser = function(){
    return $q(function(resolve, reject) {
      var currentUser = userService.getCurrentUser();
      resolve(currentUser);
    });
  };

  getCurrentUser().then(function(user){
    $scope.currentUser = user;
  });

  var getBooks = function(){
    bookService.getBooks().then(function (books){
      $scope.books = books.data;
    });
  };
  getBooks();

  $scope.deleteBook = function(id){
    bookService.deleteBook(id).then(function(res){
      getBooks();
      getLibraryList();
    });
  };

  // deprecated?
  // $scope.addBook = function(title, author){
  //   bookService.addBook(title, author);
  //   $scope.newBookTitle = "";
  //   $scope.newBookAuthor = "";
  //   getBooks();
  //   getLibraryList();
  // };

  $scope.addBookByIsbn = function(isbn){
    bookService.addBookByIsbn(isbn);
    $scope.newBookIsbn = "";
    getBooks();
    getLibraryList();
  };

  $scope.azSearchForBook = function(searchParam, searchTerm){
    bookService.azSearchForBook(searchParam, searchTerm).then(function(result){
      $scope.azSearchResults = result.data;
    });

  };

  $scope.dbSearchForBook = function(searchParam, searchTerm){
    bookService.dbSearchForBook(searchParam, searchTerm).then(function(result){
      $scope.dbSearchResults = result.data;
    });

  };

  $scope.editBook = function(id, key, val){
    bookService.editBook(id, key, val).then(function(res){
      getBooks();
      getLibraryList();
    });
  };

  // DEPRECATED
  // $scope.updateFromAmazon = function(id){
  //   bookService.updateFromAmazon(id).then(function(res){
  //     getBooks();
  //     getLibraryList();
  //   });
  // };


  //users ******************************************************************

  $scope.userOptions = [ //keys for editUser
		{
			name: 'Name',
			value: 'name',
		},
	];

  var getUsers = function(){
    userService.getUsers().then(function (users){
      $scope.users = users.data;
    });
  };
  getUsers();

  $scope.addUser = function(name){
    userService.addUser(name).then(function(res){
      getUsers();
      getLibraryList();
    });
  };

  $scope.deleteUser = function(userId, libraryId){
    libraryService.deleteLibrary(libraryId)
    .then(function(res){
      userService.deleteUser(userId);
    })
    .then(function(res){
      getUsers();
      getLibraryList(); //remove later
    });
  };

  $scope.editUser = function(id, key, val){
    userService.editUser(id, key, val).then(function(res){
      getUsers();
      getLibraryList();
    });
  };

  //library ******************************************************************

  // unused, probably needs to be deleted
  // var refreshUserLibrary = function(libraryId){
  //   libraryService.getUserLibrary(libraryId).then(function(userLibrary){
  //     $scope.userLibrary = userLibrary.data;
  //   });
  // };

  // deprecated
  // $scope.getUserLibrary = function(libraryId){
  //   libraryService.getUserLibrary(libraryId).then(function(userLibrary){
  //     $scope.userLibrary = userLibrary.data;
  //     console.log('userLibrary:', userLibrary.data);
  //
  //   });
  // };


  $scope.getUserLibrary = function(userId){
    return libraryService.getUserLibrary(userId).then(function(userLibrary){
      return userLibrary.data;
    });
  };


  var getLibraryList = function(){
    libraryService.getLibraryList().then(function (libraryList){
      $scope.libraryList = libraryList.data;
    });
  };
  getLibraryList();



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
      //getLibraryList();
    });
  };

  $scope.removeFromLibrary = function(libraryId, bookId){
    console.log('bookid', bookId);
    libraryService.removeFromLibrary(libraryId, bookId).then(function(res){
      getLibraryList();
    });
  };

});
