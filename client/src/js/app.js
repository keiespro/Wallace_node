angular.module('wallace-edit', ['ui.router', 'wallace.services', 'angularMoment', 'modal-dialog'])

.config(function( $stateProvider, $urlRouterProvider, $httpProvider){
	 $httpProvider.defaults.withCredentials = true;
	 var band = {
		 templateUrl: 'js/layouts/views/band.ng.html',
		 controller: function($scope, $rootScope){
			 $scope.bandEnabled = true;
			 $rootScope.headerEnabled = false;
		 }
	 };

	 $stateProvider
	.state('user-sign-up', {
		url: '/',
		auth: false,
		params: {
			email: ''
		},
		views: {
			'body': {
				templateUrl: 'js/users/views/sign-up.ng.html',
				controller: 'UserSignUpCtrl'
			},
			'band': band,
		}
	})
	.state('user-sign-in', {
		url: '/users/sign-in',
		auth: false,
		params: {
			email: ''
		},
		views: {
			'body': {
				templateUrl: 'js/users/views/sign-in.ng.html',
				controller: 'UserSignInCtrl'
			},
			'band': band,
		}
	})
	.state('user-confirm-sent', {
		url: '/users/confirm',
		auth: false,
		params: {
			name: ''
		},
		views: {
			'body' : {
				templateUrl: 'js/users/views/confirm-sent.ng.html',
				controller: 'UserConfirmCtrl'
			},
			'band': band,
		}
	})
	.state('user-verified', {
		url: '/users/verify/:token',
		auth: false,
		views : {
			'body' : {
				templateUrl: 'js/users/views/verified.ng.html',
				controller: 'UserVerifiedCtrl'
			},
			'band' : band
		}

	})
	.state('user-reset-password', {
		url: '/users/reset-password',
		auth: false,
		views : {
			'body' : {
				templateUrl: 'js/users/views/reset-password.ng.html',
				controller: 'UserPasswordResetCtrl'
			},
			'band': band
		}
	})
	.state('user-reset-password-success', {
		url: '/users/reset-password-success',
		auth: false,
		views : {
			'body' : {
				templateUrl: 'js/users/views/reset-password-success.ng.html',
				controller: 'UserPasswordResetSuccessCtrl'
			},
			'band': band
		}
	})
	.state('user-set-password', {
		url: '/users/set-password/:token',
		auth: false,
		views : {
			'body' : {
				templateUrl: 'js/users/views/set-password.ng.html',
				controller: 'UserSetPasswordCtrl'
			},
			'band': band
		}
	})
	.state('user-set-password-success', {
		url: '/users/set-password-success',
		auth: false,
		views : {
			'body' : {
				templateUrl: 'js/users/views/set-password-success.ng.html',
				controller: 'UserSetPasswordSuccessCtrl'
			},
			'band': band
		}
	})
	.state('library', {
		url: '/library',
		auth: true,
		views : {
			'header' : {
				templateUrl: 'js/layouts/views/header.ng.html',
				controller: 'HeaderCtrl'
			},
			'body' : {
				templateUrl: 'js/library/views/library.ng.html',
				controller: 'LibraryListCtrl'
			}
		}
	})
	.state('papers', {
		url: '/papers/:paperId',
		auth: true,
		views: {
			'header' : {
				templateUrl: 'js/papers/views/header.ng.html',
				controller: 'PaperHeaderCtrl'
			},
			'body' : {
				templateUrl: 'js/papers/views/show.ng.html',
				controller: 'PaperViewCtrl'
			}
		}
	})
	.state('papers-accept', {
		url: '/papers/accept/:shareToken',
		views: {
			'body' : {
				templateUrl: 'js/papers/views/accept.ng.html',
				controller: 'PaperAcceptCtrl'
			},
			'band': band
		}
	})
	;

	$urlRouterProvider.otherwise("/");
})

.config(function($sceDelegateProvider) {
	$sceDelegateProvider.resourceUrlWhitelist([
    	'self',
    	'$$API_URL/**',
    	'$$ETHERPAD_URL/**'
    ]);
})

.run(function($rootScope, $timeout, $state, API) {
	$rootScope.signOut = function(){
		API.sign_out().then(function() {
			$state.go('user-sign-in');
		});
	};
	$rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
		$rootScope.mainClass = '';
		API.current_user().then(function(user) {
			if (toState.auth === true && !user) {
				event.preventDefault();
				$state.go('user-sign-up');
			} else if (toState.auth === false && user) {
				event.preventDefault();
				$state.go('library');
			}
		});
	});
	$rootScope.$on('$viewContentLoaded', function() {
		$timeout(function() {
			componentHandler.upgradeAllRegistered();
		});
	});
})
;
