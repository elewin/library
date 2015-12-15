angular.module('library').service('bookService', function($stateParams, $http) {

  this.getBooks =  function(){
    return $http({
      method: 'GET',
      url: '/api/books'
    });
  };

  this.getBook = function(id){
    return $http({
      method: 'GET',
      url: '/api/books'+id,
    });
  };

  // this.lookUpIsbn = function(isbn){
  //   console.log('looking up info for ISBN: ' + isbn );
  //   return $http({
  //     method: 'GET',
  //     url: 'https://www.googleapis.com/books/v1/volumes?q=isbn:'+isbn,
  //   })
  // };

  this.deleteBook = function(id){
    console.log('Deleting book id:', id);
    return $http({
      method: 'DELETE',
      url: '/api/books/'+id,
    });
  };

  this.editBook = function(id, key, newVal){
    console.log('editing book id:', id, 'key:', key, 'to:', newVal);
    var dataObj = {};
    dataObj[key] = newVal;
    return $http({
      method: 'PUT',
      url: '/api/books/'+id,
      data: JSON.stringify(dataObj),
    });
  };

  this.updateFromAmazon = function(id){
    console.log(id);
    var dataObj = {};
    return $http({
      method: 'GET',
      url: '/api/books/'+id+'/azUpdate',
    });
  };

  this.addBook = function(title, author){
    console.log('adding ' + title + ' by ' + author);

    return $http({
      method: 'POST',
      url: '/api/books',
      data: JSON.stringify({
        title: title,
        author: author,
        isbn: 0,
      }),
    });
  };

  this.addBookByIsbn = function(isbn){
    console.log('adding ISBN:', isbn);

    return $http({
      method: 'POST',
      url: '/api/books',
      data: JSON.stringify({
        isbn: isbn,
      }),
    });
  };

});
