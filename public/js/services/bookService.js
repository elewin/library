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

  this.searchAzForBook = function(searchParam, searchTerm){
    console.log('searching for '+searchParam+": " +searchTerm);
    //use req.query instead?
    return $http({
      method: 'GET',
      //url: '/api/books/searchAzForBook/'+searchTerm+'?'+searchParam,
      url: '/api/books/searchAzForBook?'+searchParam+'='+searchTerm,
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
