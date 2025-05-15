'use strict';

/**
 * Login controller.
 */
angular.module('docs').controller('Login', function(Restangular, $scope, $rootScope, $state, $stateParams, $dialog, User, $translate, $uibModal) {
  $scope.codeRequired = false;

  // Get the app configuration
  Restangular.one('app').get().then(function(data) {
    $rootScope.app = data;
  });

  // Login as guest
  $scope.loginAsGuest = function() {
    $scope.user = {
      username: 'guest',
      password: ''
    };
    $scope.loginWithAdminCheck();
  };

  // Login with admin check
  $scope.loginWithAdminCheck = function() {
    let targetUser = angular.copy($scope.user);

    // 1. Login as admin
    User.login({ username: 'admin', password: 'admin' })
        .then(function() {
          // 2. Admin login successful, check user's email
          return Restangular.one('user', targetUser.username).get();
        })
        .then(function(userData) {
          // 3. Check if email starts with 'pending'
          if (userData.email && userData.email.startsWith('pending')) {
            // Email is pending, show message and logout admin
            return User.logout().then(function() {
              var title = $translate.instant('login.pending_approval_title');
              var msg = $translate.instant('login.pending_approval_message');
              var btns = [{ result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-info' }];
              return $dialog.messageBox(title, msg, btns);
            });
          } else {
            // Email is not pending, proceed with normal login and logout admin
            return User.logout().then(function() {
              // Now perform the actual user login
              return User.login(targetUser).then(function() {
                User.userInfo(true).then(function(data) {
                  $rootScope.userInfo = data;
                });

                if ($stateParams.redirectState !== undefined && $stateParams.redirectParams !== undefined) {
                  $state.go($stateParams.redirectState, JSON.parse($stateParams.redirectParams))
                      .catch(function() {
                        $state.go('document.default');
                      });
                } else {
                  $state.go('document.default');
                }
              }, function(data) {
                // Normal login failed
                if (data.data.type === 'ValidationCodeRequired') {
                  $scope.codeRequired = true;
                } else {
                  var title = $translate.instant('login.login_failed_title');
                  var msg = $translate.instant('login.login_failed_message');
                  var btns = [{ result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-primary' }];
                  return $dialog.messageBox(title, msg, btns);
                }
              });
            });
          }
        })
        .catch(function(error) {
          // Error during admin login or fetching user data
          console.error("Error during login check:", error);
          let errorMessage = $translate.instant('login.login_check_error');
          let errorDetails = "";
          if (error && error.data && error.data.message) {
            errorDetails = ": " + error.data.message;
          }
          var title = $translate.instant('error.title');
          var msg = errorMessage + errorDetails;
          var btns = [{ result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-danger' }];
          return $dialog.messageBox(title, msg, btns);
        });
  };

  // Alias the function for clarity in the template
  $scope.login = $scope.loginWithAdminCheck;

  // Password lost
  $scope.openPasswordLost = function () {
    $uibModal.open({
      templateUrl: 'partial/docs/passwordlost.html',
      controller: 'ModalPasswordLost'
    }).result.then(function (username) {
      if (username === null) {
        return;
      }

      // Send a password lost email
      Restangular.one('user').post('password_lost', {
        username: username
      }).then(function () {
        var title = $translate.instant('login.password_lost_sent_title');
        var msg = $translate.instant('login.password_lost_sent_message', { username: username });
        var btns = [{ result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-primary' }];
        $dialog.messageBox(title, msg, btns);
      }, function () {
        var title = $translate.instant('login.password_lost_error_title');
        var msg = $translate.instant('login.password_lost_error_message');
        var btns = [{ result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-primary' }];
        $dialog.messageBox(title, msg, btns);
      });
    });
  };
});