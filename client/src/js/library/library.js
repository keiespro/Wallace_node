angular.module('wallace-edit')

.controller('LibraryListCtrl', function($scope, $rootScope, $state, $stateParams, $timeout, API){
	$scope.loading = true;
	$scope.papersType = "My Papers";
	$scope.papers = {};
	$scope.paper = {};
	var refreshPapers = function() {
		$scope.loading = true;
		API.get_papers().then(function(result) {
			$scope.papers = {
				'My Papers': result.data.yourPapers,
				'Shared with Me': result.data.sharedPapers
			};
			$scope.loading = false;
			$timeout(function() {
				componentHandler.upgradeAllRegistered();
			});
		});
	};
	refreshPapers();
	$scope.setPapersType = function(type) {
		$scope.papersType = type;
	};
	$scope.openPaper = function(id) {
		$state.go('papers', {paperId: id});
	};
	$scope.deletePaper = function(paper, $event) {
		$event.stopPropagation();
		var del = confirm("Are you sure you want to permanantly delete \""+paper.title+"\"?");
		if (del) {
			$scope.loading = true;
			API.delete_paper(paper.id).then(function() {
				refreshPapers();
			});
		}
	};

	$scope.modalShown = false;
	$scope.toggleModal = function() {
		$scope.modalShown = !$scope.modalShown;
		if ($scope.modalShown) {
			$rootScope.mainClass = 'library-wrap';
		} else {
			$rootScope.mainClass = '';
		}
	};
	$scope.writingStyles = [
		{
			name : "Options Coming Soon"
		}
	];

	var fileInput;
	$scope.fileChanged = function() {
		fileInput = event.target;
		var file = fileInput.files[0] || false;
		if (!file) {
			return;
		}
		$scope.paper.file = file;
		$scope.$apply();
	};
	$scope.removeFile = function($event) {
		$event.stopPropagation();
		$event.preventDefault();
		$scope.paper.file = false;
		fileInput.value = null;
		return false;
	};

	$scope.uploadPaper = function() {

	};
	$scope.createPaper = function() {
		if ($scope.creating) {
			return;
		}
		$scope.creating = true;
		var title = $scope.paper.doc_title || "Untitled Paper";
		try {
			API.create_paper(title).then(function(result){
				var paperId = result.data.paperId;
				if ($scope.paper.file) {
					API.import(result.data.paperId, $scope.paper.file).then(function(result){
						$state.go('papers', { paperId : paperId });
					});
				} else {
					$state.go('papers', { paperId : paperId });
				}
			});
		}
		catch (e){

		}

	};
})
;
