var app = angular.module('library', ['ui.router', 'ngSanitize']);

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
        return $q.reject();
      }
    };
  });

});
