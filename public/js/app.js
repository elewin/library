var app = angular.module('library', ['ui.router', 'ngSanitize', 'permission']);

app.run(function (Permission, userService, $q) {

  Permission
    // Define user role calling back-end

    //anon is incomplete
    .defineRole('anon', function (stateParams) {
      var deferred = $q.defer();

      userService.getCurrentUser().then(function (data) {
        console.log('data', data);
        if (!data){
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, function () {
        // Error with request
        deferred.reject();
      });

      return deferred.promise;
    })
    .defineRole('user', function (stateParams) {
      var deferred = $q.defer();

      userService.getCurrentUser().then(function (data) {
        if (data.roles.indexOf('user') !== -1){
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, function () {
        // Error with request
        deferred.reject();
      });

      return deferred.promise;
    })
    // A different example for admin
    .defineRole('admin', function (stateParams) {
      var deferred = $q.defer();

      userService.getCurrentUser().then(function (data) {
        if (data.roles.indexOf('admin') !== -1){
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, function () {
        // Error with request
        deferred.reject();
      });

      return deferred.promise;
    });
});

app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
  $stateProvider
  .state('main', {
    url: '/',
    abstract: true,
    controller: 'mainCtrl',
    templateUrl: './tmpl/main.html',
  })
	.state('main.home', {
    url: '',
		controller: 'homeCtrl',
		templateUrl: './tmpl/home.html',
	})
  .state('main.admin', {
    url: 'admin',
    controller: 'adminCtrl',
    templateUrl: './tmpl/secure/admin.html',
    data:{
      permissions: {
        only: ['admin'],
        redirectTo: 'main.test'
      }
    }
  })
  .state('main.test', {
    url: 'test',
    templateUrl: './tmpl/test.html',
  })
  .state('logout', {
		url: '/logout',
		controller: function(userService, $state) {
			userService.logout().then(function() {
				$state.go('main.home');
			});
		}
	});

  $urlRouterProvider.otherwise('/');

  $httpProvider.interceptors.push(function($q) {
    return {
      responseError: function(res) {
        if (res.status === 401) {
          console.log('intercepted!');
        	document.location = '/#/';
        	// $state.go('main');
        }
        return $q.reject(res);
      }
    };
  });

});
