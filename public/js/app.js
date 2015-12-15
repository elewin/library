var app = angular.module('library', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
  $stateProvider
	.state('main', {
    url: '/',
		controller: 'mainCtrl',
		templateUrl: './tmpl/main.html',
	})
  .state('admin', {
    url: '/admin',
    controller: 'adminCtrl',
    templateUrl: './tmpl/admin.html',
  })
  .state('logout', {
		url: '/logout',
		controller: function(userService, $state) {
			userService.logout().then(function() {
				$state.go('main');
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
        	//$state.go('login');
        }
        return $q.reject();
      }
    };
  });

});
