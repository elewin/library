angular.module('library').service('libraryService', function($stateParams, $http, $q) {

  // this.getLibrary =  function(id){
  //   return $http({
  //     method: 'GET',
  //     url: '/api/library/'+id,
  //   })
  // };

  this.getLibraryList = function(){
    return $http({
      method: 'GET',
      url: '/api/library',
    })
  };

  this.getUserLibrary = function(libraryId){
    return $http({
      method: 'GET',
      url: '/api/library/'+libraryId,
    })
  };

    this.deleteLibrary = function(id){
    console.log('Deleting library id:', id);
    return $http({
      method: 'DELETE',
      url: '/api/library/'+id,
    })
  };

  this.editLibrary = function(id, key, newVal){
    console.log('editing library id:', id, 'key:', key, 'to:', newVal);
    var dataObj = {};
    dataObj[key] = newVal;
    return $http({
      method: 'PUT',
      url: '/api/library/'+id,
      data: JSON.stringify(dataObj),
    })
  };

  //can this be moved elsewhere? i want a single library to be made when a new user is made
  this.addLibrary = function(){
    return $http({
      method: 'POST',
      url: '/api/library',
    })
  };

  // this.addLibraryToUser = function(userId){ // ????????????????????????????????????
  //   return $http({
  //     method: 'POST',
  //     url: '/api/user/'+userId+'/library',
  //   })
  // };

  this.addToLibrary = function(libraryId, bookId){ //right now userId is actually being passed libraryId
    console.log('adding bookId:', bookId, 'to libraryId:', libraryId);
    return $http({
      method: 'PUT',
      url: '/api/library/' + libraryId, //??
      data: {
        books: bookId,
      },
    }).then(function(res) {
      return res.data;
    });
  };

});
