angular.module('library').service('adminService', function($stateParams, $http) {

  this.getAdmin = function(){
    return $http({
      method: 'GET',
      url: '/api/admin'
    });
  };

});
