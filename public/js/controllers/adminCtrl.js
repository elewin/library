angular.module('library').controller('adminCtrl', function($scope, bookService) {

  $scope.options = [ //keys for editBook
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
  }
  getBooks();

  $scope.deleteBook = function(id){
    bookService.deleteBook(id).then(function(res){
      getBooks();
    });
  }

  $scope.addBook = function(title, author, isbn){
    bookService.addBook(title, author, isbn);
    $scope.newBookTitle = "";
    $scope.newBookAuthor = "";
    $scope.newBookIsbn = "";
    getBooks();

  }

  $scope.editBook = function(id, key, val){
    bookService.editBook(id, key, val).then(function(res){
      getBooks();
    });
  }

});
