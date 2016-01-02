angular.module('library').service('libraryService', function($stateParams, $http, $q) {

  this.getLibraryList = function(){
    return $http({
      method: 'GET',
      url: '/api/library',
    });
  };

  //edits the 'property' on 'bookId' in 'libraryId' to 'value'
  this.editBookInLibrary = function(libraryId, bookId, property, value){
    var dataObj = {
      property: property,
      value: value,
    };
    return $http({
      method: 'PUT',
      url:'/api/library/edit/'+libraryId+'/'+bookId,
      data: JSON.stringify(dataObj),
    });
  };

  this.doesUserHaveBook = function(libraryId, isbn){
    return $http({
      method: 'GET',
      url: '/api/library/'+libraryId+'/bookCheck?isbn='+isbn,
    });
  };

  this.getBookFromLibrary = function(libraryId, bookId){
    return $http({
      method: 'GET',
      url: '/api/library/'+libraryId+'/'+bookId,
    });
  };

  //returns a promise
  this.getUserLibrary = function(userId){
    return $http({
      method: 'GET',
      url: '/api/library/user/'+userId,
    });
  };

    this.deleteLibrary = function(id){
    console.log('Deleting library id:', id);
    return $http({
      method: 'DELETE',
      url: '/api/library/'+id,
    });
  };

  this.editLibrary = function(id, key, newVal){
    console.log('editing library id:', id, 'key:', key, 'to:', newVal);
    var dataObj = {};
    dataObj[key] = newVal;
    return $http({
      method: 'PUT',
      url: '/api/library/'+id,
      data: JSON.stringify(dataObj),
    });
  };

  //can this be moved elsewhere? i want a single library to be made when a new user is made
  this.addLibrary = function(){
    return $http({
      method: 'POST',
      url: '/api/library',
    });
  };

  this.addToLibraryByBookId = function(libraryId, bookId){
    console.log('adding bookId:', bookId, 'to libraryId:', libraryId);
    return $http({
      method: 'PUT',
      url: '/api/library/' + libraryId + '/add?bookId='+bookId,
    }).then(function(res) {
      return res.data;
    });
  };

  this.addToLibraryByIsbn = function(libraryId, isbn){
    console.log('adding isbn:', isbn, 'to libraryId:', libraryId);
    return $http({
      method: 'PUT',
      url: '/api/library/' + libraryId + '/add?isbn='+isbn,
    }).then(function(res) {
      return res.data;
    });
  };

  this.removeFromLibrary = function(libraryId, bookId){
    console.log('removing bookId:', bookId, 'from libraryId:', libraryId);
    return $http({
      method: 'PUT',
      url: '/api/library/' + libraryId + '/remove',
      data: {
        books: {
          book: {bookData: bookId},
        }
      },
    }).then(function(res) {
      return res.data;
    });
  };

});
