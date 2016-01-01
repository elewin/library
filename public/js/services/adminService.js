angular.module('library').service('adminService', function($stateParams, $http) {

  this.getAdmin = function(){
    return $http({
      method: 'GET',
      url: '/api/admin'
    });
  };

  this.createDb = function(){
    return $http({
      method: 'POST',
      url: '/api/admin/createDb'
    });
  };


});
