var app = angular.module('library', ['ui.router']);

console.log('app loads');

app.config(function($stateProvider, $urlRouterProvider) {
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
	$urlRouterProvider.otherwise('/');
});
