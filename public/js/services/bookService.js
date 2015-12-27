angular.module('library').service('bookService', function($stateParams, $http) {

  this.getBooks =  function(){
    return $http({
      method: 'GET',
      url: '/api/books'
    });
  };

  // deprecated?
  // this.getBook = function(id){
  //   return $http({
  //     method: 'GET',
  //     url: '/api/books'+id,
  //   });
  // };

  // this.lookUpIsbn = function(isbn){
  //   console.log('looking up info for ISBN: ' + isbn );
  //   return $http({
  //     method: 'GET',
  //     url: 'https://www.googleapis.com/books/v1/volumes?q=isbn:'+isbn,
  //   })
  // };

  this.deleteBook = function(id){
    console.log('attempting to delete book id:', id);
    return $http({
      method: 'DELETE',
      url: '/api/books/'+id,
    });
  };

  this.editBook = function(id, key, newVal){
    console.log('attempting to edit book id:', id, 'key:', key, 'to:', newVal);
    var dataObj = {};
    dataObj[key] = newVal;
    return $http({
      method: 'PUT',
      url: '/api/books/'+id,
      data: JSON.stringify(dataObj),
    });
  };

  // DEPRECATED
  // this.updateFromAmazon = function(id){
  //   console.log(id);
  //   var dataObj = {};
  //   return $http({
  //     method: 'GET',
  //     url: '/api/books/'+id+'/azUpdate',
  //   });
  // };

  // DEPRECATED
  // this.addBook = function(title, author){
  //   console.log('adding ' + title + ' by ' + author);
  //
  //   return $http({
  //     method: 'POST',
  //     url: '/api/books',
  //     data: JSON.stringify({
  //       title: title,
  //       author: author,
  //       isbn: 0,
  //     }),
  //   });
  // };

  //searches the Amazon Products API for a book
  this.azSearchForBook = function(searchParam, searchTerm){
    console.log('searching amazon for '+searchParam+": " +searchTerm);
    return $http({
      method: 'GET',
      url: '/api/books/azSearch?param='+searchParam+'&term='+searchTerm,
    });
  };

  //searches our database for a book
  this.dbSearchForBook = function(searchParam, searchTerm){
    console.log('searching db for '+searchParam+": " +searchTerm);
    return $http({
      method: 'GET',
      url: '/api/books/dbSearch?param='+searchParam+'&term='+searchTerm,
    });
  };

  this.unifiedSearchForBook = function(searchParam, searchTerm){
    console.log('unified search for '+searchParam+": " +searchTerm);
    return $http({
      method: 'GET',
      url: '/api/books/search?param='+searchParam+'&term='+searchTerm,
  });

};
  this.addBookByIsbn = function(isbn){
    console.log('attempting to add ISBN:', isbn);

    return $http({
      method: 'POST',
      url: '/api/books',
      data: JSON.stringify({
        isbn: isbn,
      }),
    });
  };

});
