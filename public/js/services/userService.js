angular.module('library').service('userService', function($stateParams, $http, $q) {

  this.getUsers =  function(){
    return $http({
      method: 'GET',
      url: '/api/users'
    });
  };

  var user;

  //returns a promise that resolves true or false if a user's roles array coantains the given role
  this.doesUserHaveRole = function(role){
    var defer = $q.defer();
    this.getCurrentUser().then(function(user){ //get the user
      if(user){ //see if we were returned a user
        if(user.roles.indexOf(role) >= 0){ //check if the given role is in the user's roles array
          defer.resolve(true); //it is
        }
        else {
          defer.resolve(false); //it isn't
        }
      }
      else {
        defer.resolve(false); //if there is no user, then there are no roles so resolve false
      }
    });
    return defer.promise;
  };

  //returns a promise that resolves true or false if a user is logged in
  this.isUserLoggedIn = function(){
    var defer = $q.defer();
    $http({
      method: "GET",
      url: "/api/users/isUserLoggedIn"
    }).then(function(response){
      isUser = response.data;
      if(isUser){
        defer.resolve(true);
      }
      else{
        //defer.reject(isUser);
        defer.resolve(false);
      }
    });

    return defer.promise;
  };

  //returns a promise that resolves the currently logged in user's user data
  this.getCurrentUser = function() {
    var defer = $q.defer();
    if (user) {  //if there is a user, resolve it
      defer.resolve(user);
    }
    else { //there wasn't a user. . .
      this.isUserLoggedIn().then(function(result){ // . . .so check if a user is even logged in. . .
        if(result){
          $http({
            method: "GET",
            url: "/api/users/currentUser"
          }).then(function(response) {
            user = response.data; //. . .and if so get the user data and return it
            defer.resolve(response.data);
          });
        }
        else{ //but if no one is logged in then resolve false
          //defer.reject();
          defer.resolve(false);
        }
      });
    }
    return defer.promise;
  };

  // old version that did not check if there was a user logged in or not
  // //returns a promise that resolves the currently logged in user
  // this.getCurrentUser = function() {
  //   var defer = $q.defer();
  //   if (user) {  //if there is a user, resolve it
  //     defer.resolve(user);
  //   }
  //   else { //there wasn't a user. . .
  //     $http({
  //       method: "GET",
  //       url: "/api/users/currentUser"
  //     }).then(function(response) {
  //       user = response.data; //. . .but now there is
  //       defer.resolve(response.data);
  //     });
  //   }
  //   return defer.promise;
  // };

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
