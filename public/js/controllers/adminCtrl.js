angular.module('library').controller('adminCtrl', function($scope, bookService, userService) {

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
    });
  };

  $scope.addBook = function(title, author, isbn){
    bookService.addBook(title, author, isbn);
    $scope.newBookTitle = "";
    $scope.newBookAuthor = "";
    $scope.newBookIsbn = "";
    getBooks();

  };

  $scope.editBook = function(id, key, val){
    bookService.editBook(id, key, val).then(function(res){
      getBooks();
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
    });
  };
  getUsers();

  $scope.addUser = function(name){
    userService.addUser(name).then(function(res){
      getUsers();
    });
  };

  $scope.deleteUser = function(id){
    userService.deleteUser(id).then(function(res){
      getUsers();
    });
  };

  $scope.editUser = function(id, key, val){
    userService.editUser(id, key, val).then(function(res){
      getUsers();
    });
  };

});
