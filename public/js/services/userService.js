angular.module('library').service('userService', function($stateParams, $http, $q) {

  this.getUsers =  function(){
    return $http({
      method: 'GET',
      url: '/api/users'
    });
  };

  var user;

  //returns the currently logged in user
  this.getCurrentUser = function() {
    var defer = $q.defer();
    if (user) {
      defer.resolve(user);
    }
    else {
      $http({
        method: "GET",
        url: "/api/users/currentUser"
      }).then(function(response) {
        user = response.data;
        defer.resolve(response.data);
      });
    }
    return defer.promise;
  };

  this.getUser = function(id){
    return $http({
      method: 'GET',
      url: '/api/users'+id,
    });
  };

  this.deleteUser = function(id){
    console.log('Deleting user id:', id);
    return $http({
      method: 'DELETE',
      url: '/api/users/'+id,
    });
  };

  this.editUser = function(id, key, newVal){
    console.log('editing user id:', id, 'key:', key, 'to:', newVal);
    var dataObj = {};
    dataObj[key] = newVal;
    return $http({
      method: 'PUT',
      url: '/api/users/'+id,
      data: JSON.stringify(dataObj),
    });
  };

  this.addUser = function(name){
    console.log('adding ' + name);
    return $http({
      method: 'POST',
      url: '/api/users',
      data: JSON.stringify({
        name: name,
      }),
    });
  };

  this.logout = function() {
		user = null;
		var defer = $q.defer();
		$http({
				method: "GET",
				url: "/api/auth/fb/logout"
			}).then(function(response) {
				defer.resolve(response.data);
			});
		return defer.promise;
	};

});
