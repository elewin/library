var app = angular.module('library', ['ui.router', 'permission', 'angularSlideables', 'angularUtils.directives.dirPagination']);

app.run(function (Permission, userService, $q) {

  Permission
    // Define user role calling back-end
    .defineRole('user', function (stateParams) {
      var deferred = $q.defer();

      userService.getCurrentUser().then(function (data) {
        if(data){ //ensure that a user is logged in (or else we'll get all kinds of errors if we proceed)
          if (data.roles.indexOf('user') > -1){ //search for this role in their roles array
            deferred.resolve();
          } else {
            deferred.reject();
          }
        } else {
          deferred.reject();
        }
      }, function () {
        // Error with request
        deferred.reject();
      });
      return deferred.promise;
    })
    .defineRole('admin', function (stateParams) {
      var deferred = $q.defer();

      userService.getCurrentUser().then(function (data) {
        if(data){
          if (data.roles.indexOf('admin') > -1){
            deferred.resolve();
          } else {
            deferred.reject();
          }
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
  //this is the header at the top of the page
  .state('main', {
    url: '/',
    abstract: true,
    controller: 'mainCtrl',
    templateUrl: './tmpl/main.html',
    resolve: {
      userRef: function(userService, $stateParams){
        return userService.getCurrentUser();
      },
    },
  })
  //front page of site, visible to all visitors:
	.state('main.home', {
    url: '',
		controller: 'homeCtrl',
		templateUrl: './tmpl/home.html',
    resolve: {
      userRef: function(userService, $stateParams){
        return userService.getCurrentUser();
      },
    }
	})
  //admin page
  .state('main.admin', {
    url: 'admin',
    controller: 'adminCtrl',
    templateUrl: './tmpl/admin.html',
    data:{
      permissions: {
        only: ['admin'],
        redirectTo: 'main.home'
      }
    },
    resolve: {
      userRef: function(userService, $stateParams){
        return userService.getCurrentUser();
      },
    },
  })
  //book view:
  .state('main.book', {
    url: 'book?:isbn',
    controller: 'bookPageCtrl',
    templateUrl: './tmpl/book.html',
    resolve: {
      bookRef: function(bookService, $stateParams){
        return bookService.getBook($stateParams.isbn);
      },
      userRef: function(userService, $stateParams){
        return userService.getCurrentUser();
      },
    }
  })
  .state('main.bookPreview', {
    url: 'bookPreview?:isbn',
    controller: 'bookPreviewPageCtrl',
    templateUrl: './tmpl/bookPreview.html',
    resolve: {
      bookRef: function(bookService, $stateParams){
        return bookService.getAzBookByIsbn($stateParams.isbn);
      },
      userRef: function(userService, $stateParams){
        return userService.getCurrentUser();
      },
    }
  })
  //library view:
  .state('main.library', {
    url: 'library',
    controller: 'libraryCtrl',
    data:{
      permissions: {
        only: ['user'],
        redirectTo: 'main.home',
      }
    },
    templateUrl: './tmpl/library.html',
    resolve: {
      userRef: function(userService, $stateParams){
        return userService.getCurrentUser();
      },
    },
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
