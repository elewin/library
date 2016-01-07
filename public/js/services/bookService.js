angular.module('library').service('bookService', function($stateParams, $http) {

  this.getAllBooks =  function(){
    return $http({
      method: 'GET',
      url: '/api/books/all'
    });
  };


  this.getBook = function(isbn){
    return $http({
      method: 'GET',
      url: '/api/books?isbn='+isbn
    });
  };


  this.getAzBookByIsbn = function(isbn){
    return $http({
      method: 'GET',
      url: '/api/books/amazon?isbn='+isbn,
    });
  };


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


  this.searchForBook = function(searchParam, searchTerm){
    console.log('searching for '+searchParam+": " +searchTerm);
    return $http({
      method: 'GET',
      url: '/api/books/search?param='+searchParam+'&term='+searchTerm,
    });
  };

  this.comboAdd = function(libraryId, isbn){
    console.log('adding ', isbn, 'to book collection and then to library', libraryId);
    return $http({
      method: 'POST',
      url: '/api/books?libraryId='+libraryId,
      data: JSON.stringify({
        isbn: isbn,
      }),
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
