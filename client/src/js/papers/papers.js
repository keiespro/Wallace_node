angular.module('wallace-edit')

.controller('PaperViewCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'API', '$timeout', function($scope, $rootScope, $state, $stateParams, API, $timeout) {
	$rootScope.mainClass = 'mdl-grid paper-main-wrap';
	$scope.loading = true;
	API.get_paper($stateParams.paperId).then(function(result) {
		if (!result.data.url) {
			return alert(result.data.message);
		}
		$rootScope.title = result.data.title;
		$scope.embedUrl = result.data.url;
		$scope.loading = false;
		$timeout(function() {
			componentHandler.upgradeAllRegistered();
		}, 1000);
	});
}])
.controller('PaperHeaderCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'API', '$timeout', function($scope, $rootScope, $state, $stateParams, API, $timeout) {
	$rootScope.headerEnabled = true;
	$scope.updateTitle = function(title) {
		if (!title) {
			title = "Untitled Paper";
			event.target.value = title;
		}
		API.update_title($stateParams.paperId, title).then(function(result) {});
	};
	$scope.titleEnter = function($event) {
		$event.target.blur();
	};
}])
.controller('PaperAcceptCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'API', '$timeout', function($scope, $rootScope, $state, $stateParams, API, $timeout) {
	var shareToken = $stateParams.shareToken;
	$scope.loading = true;
	API.accept_paper(shareToken).then(function(result) {
		if (result.data.message == "redirect") {
			localStorage.setItem('loginRedirect', location.hash);
			localStorage.setItem('acceptShareToken', shareToken);
			$state.go(result.data.redirect, { email: result.data.email });
		} else if (result.data.message == 'access') {
			$state.go('papers', {paperId: result.data.paperId});
		} else {
			$scope.loading = false;
			$scope.message = result.data.error;
		}
	}, function(result) {
		$scope.loading = false;
		$scope.message = result.data.error;
	});
}])
;
