angular.module('wallace.services', [])

.factory('API', function($http, $rootScope, $q) {
	var API = {};

	var host = '$$API_URL/';
	var urls = {
		sign_up: host+'sign_up',
		sign_in: host+'sign_in',
		sign_out: host+'sign_out',
		auth_check: host+'auth_check',
		verify_account: host+'verify_account',
		reset_password: host+'reset_password',
		set_password: host+'set_password',
		create_paper: host+'papers/create',
		get_papers: host+'papers',
		get_paper: host+'papers/',
		import: host+'papers/import/',
		delete_paper: host+'papers/delete/',
		update_title: host+'papers/title/',
		accept_paper: host+'papers/accept/',
	};

	API.get = function(url) {
		return $http.get(url);
	};

	API.post = function(url, params, options) {
		options = options || {};
		return $http.post(url, params, options);
	};

	API.auth_check = function() {
		return this.get(urls.auth_check);
	};

	API.current_user = function() {
		if ($rootScope.user !== undefined) {
			return $q.resolve($rootScope.user);
		} else {
			return this.auth_check().then(function(result) {
				if (result.data.user) {
					$rootScope.user = result.data.user;
					return $q.resolve($rootScope.user);
				} else {
					$rootScope.user = false;
					return $q.resolve(false);
				}
			}).catch(function() {
				$rootScope.user = false;
				return $q.resolve(false);
			});
		}
	};

	API.sign_up = function(name, email, password) {
		return this.post(urls.sign_up, {
			fullName: name,
			email: email,
			password: password,
			acceptShareToken: localStorage.getItem('acceptShareToken')
		}).then(function(result) {
			if (result && result.data && result.data.user && result.data.user.isVerified) {
				$rootScope.user = result.data.user;
			}
			return $q.resolve(result);
		});
	};

	API.sign_in = function(email, password) {
		return this.post(urls.sign_in, {
			email: email,
			password: password
		}).then(function(result) {
			$rootScope.user = result && result.data && result.data.user;
			return $q.resolve(result);
		});
	};

	API.sign_out = function() {
		return this.get(urls.sign_out).then(function(result) {
			$rootScope.user = undefined;
			return $q.resolve(result);
		});
	};

	API.verify_account = function(token) {
		return this.post(urls.verify_account, {
			token: token,
		}).then(function(result) {
			$rootScope.user = result && result.data && result.data.user;
			return $q.resolve(result);
		});
	};

	API.reset_password = function(email) {
		return this.post(urls.reset_password, {
			email: email,
		});
	};

	API.set_password = function(token, password) {
		return this.post(urls.set_password, {
			token: token,
			password: password,
		}).then(function(result) {
			$rootScope.user = result && result.data && result.data.user;
			return $q.resolve(result);
		});
	};

	API.get_papers = function() {
		return this.get(urls.get_papers);
	};

	API.get_paper = function(id) {
		return this.get(urls.get_paper+id);
	};

	API.create_paper = function(title, type) {
		return this.post(urls.create_paper, {
			title: title,
			type: type
		});
	};

	API.accept_paper = function(id) {
		return this.post(urls.accept_paper+id, {});
	};

	API.delete_paper = function(id, type) {
		return this.post(urls.delete_paper+id, {});
	};

	API.update_title = function(id, title) {
		return this.post(urls.update_title+id, {
			title: title
		});
	};

	API.import = function(paperId, file, type) {
		var data = new FormData();
		data.append("document", file);
		return this.post(urls.import+paperId, data, {
	        headers: {'Content-Type': undefined },
	        transformRequest: angular.identity
	    });
	};

	return API;

});
