angular.module('library').service('userService', function($stateParams, $http) {

  this.getUsers =  function(){
    return $http({
      method: 'GET',
      url: '/api/users'
    })
  };

  this.getUser = function(id){
    return $http({
      method: 'GET',
      url: '/api/users'+id,
    })
  };

  this.deleteUser = function(id){
    console.log('Deleting user id:', id);
    return $http({
      method: 'DELETE',
      url: '/api/users/'+id,
    })
  };

  this.editUser = function(id, key, newVal){
    console.log('editing user id:', id, 'key:', key, 'to:', newVal);
    var dataObj = {};
    dataObj[key] = newVal;
    return $http({
      method: 'PUT',
      url: '/api/users/'+id,
      data: JSON.stringify(dataObj),
    })
  };

  this.addUser = function(name){
    console.log('adding ' + name);
    return $http({
      method: 'POST',
      url: '/api/users',
      data: JSON.stringify({
        name: name,        
      }),
    })
  };

});
