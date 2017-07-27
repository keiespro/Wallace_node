angular.module('wallace-edit')

.controller('UserSignUpCtrl', function($scope, $state, $stateParams, API) {
	$scope.data = {
		email: $stateParams.email
	};
	$scope.signUp = function() {
		if ($scope.data.password != $scope.data.passwordConfirm) {
			return alert('Passwords do not match');
		}
		API.sign_up($scope.data.name, $scope.data.email, $scope.data.password).then(function(response) {
			if (response && response.data.message == 'success') {
				if (response.data.user.isVerified) {
					location.hash = localStorage.getItem('loginRedirect') || '#/library';
					localStorage.removeItem('loginRedirect');
					localStorage.removeItem('acceptShareToken');
				} else {
					$state.go('user-confirm-sent', {name: $scope.data.name});
				}
			}
		}, function(result) {
			alert(result.data.error);
		});
	};
})

.controller('UserSignInCtrl', function($scope, $state, $stateParams, API) {
	$scope.data = {
		email: $stateParams.email
	};
	$scope.error = false;
	$scope.message = "";
	$scope.signIn = function() {
		API.sign_in($scope.data.email, $scope.data.password).then(function(response) {
			if (response && response.data.message == 'success') {
				if (localStorage.getItem('loginRedirect')) {
					location.hash = localStorage.getItem('loginRedirect');
					localStorage.removeItem('loginRedirect');
					localStorage.removeItem('acceptShareToken');
				} else {
					$state.go('library');
				}
			}
		}, function(result) {
			if ( result.data.error == "Invalid credentials" ) {
				$scope.message = "There was an error with your E-Mail/Password combination. Please try again.";
			}
			else if ( result.data.error == "User Not Verified") {
				$scope.message = "Please verify your email account";
			}
			$scope.error = true;
		});
	};
})

.controller('UserConfirmCtrl', function($scope, $stateParams){
  $scope.name = $stateParams.name;
})

.controller('UserVerifiedCtrl', function($scope, $state, $stateParams, $interval, API){
	$scope.seconds = 5;
	API.verify_account($stateParams.token).then(function() {
		var timer = $interval(function() {
			$scope.seconds--;
			if ($scope.seconds === 0) {
				$interval.cancel(timer);
				$scope.next();
			}
		}, 1000);
	}, function(error) {
		console.log( error );
		$state.go('user-sign-up');
	});

	$scope.next = function() {
		if (localStorage.getItem('loginRedirect')) {
			location.hash = localStorage.getItem('loginRedirect');
			localStorage.removeItem('loginRedirect');
			localStorage.removeItem('acceptShareToken');
		} else {
			$state.go('library');
		}
	};
})

.controller('UserPasswordResetCtrl', function($scope, $state, $stateParams, $interval, API){
	$scope.resetPassword = function() {
		API.reset_password($scope.email).then(function() {
			$state.go('user-reset-password-success');
		}, function(result) {
			alert(result.data.error);
		});
	};
})

.controller('UserPasswordResetSuccessCtrl', function($scope, $state, $stateParams, $interval, API){

})

.controller('UserSetPasswordCtrl', function($scope, $state, $stateParams, $interval, API){
	$scope.setPassword = function() {
		API.set_password($stateParams.token, $scope.data.password).then(function() {
			$state.go('user-set-password-success');
		}, function(result) {
			alert(result.data.error);
		});
	};
})

.controller('UserSetPasswordSuccessCtrl', function($scope, $state, $stateParams, $interval, API){
	$scope.seconds = 5;
	var timer = $interval(function() {
		$scope.seconds--;
		if ($scope.seconds === 0) {
			$interval.cancel(timer);
			$state.go('library');
		}
	}, 1000);
})
;
