angular.module('library').service('bookService', function($stateParams, $http) {

  this.getBooks =  function(){
    return $http({
      method: 'GET',
      url: '/api/books'
    })
  };

  this.getBook = function(id){
    return $http({
      method: 'GET',
      url: '/api/books'+id,
    })
  };

  this.deleteBook = function(id){
    console.log('Deleting book id:', id);
    return $http({
      method: 'DELETE',
      url: '/api/books/'+id,
    })
  };

  this.editBook = function(id, key, newVal){
    console.log('editing book id:', id, 'key:', key, 'to:', newVal);
    var dataObj = {};
    dataObj[key] = newVal;
    return $http({
      method: 'PUT',
      url: '/api/books/'+id,
      data: JSON.stringify(dataObj),
    })
  };

  this.addBook = function(title, author, isbn){
    console.log('adding ' + title + ' by ' + author + ', ISBN: '+isbn);
    return $http({
      method: 'POST',
      url: '/api/books',
      data: JSON.stringify({
        title: title,
        author: author,
        isbn: isbn,
      }),
    })
  };

});
