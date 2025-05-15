'use strict';

/**
 * Pending Users (Email Approval) page controller - Using methods from SettingsUserEdit.
 */
angular.module('docs').controller('SettingsPending', function($scope, $dialog, $state, $stateParams, Restangular, $translate) {
    $scope.pendingUsers = [];

    /**
     * Load all users and filter for pending emails.
     */
    $scope.loadPendingUsers = function() {
        Restangular.one('user/list').get({
            sort_column: 1,
            asc: true
        }).then(function(data) {
            $scope.pendingUsers = data.users.filter(function(user) {
                return user.email && user.email.startsWith('pending');
            });
        });
    };

    $scope.loadPendingUsers();

    /**
     * Approve a pending user (update email).
     */
    $scope.approveUser = function(pendingUser) {
        if (pendingUser.email.startsWith('pending')) {
            const newEmail = pendingUser.email.replace('pending', '');

            // **Backend API call to update the user's email is crucial.**
            Restangular.one('user', pendingUser.username).post('', { email: newEmail }).then(function() {
                $scope.loadPendingUsers(); // Reload the list after approval
            }, function(error) {
                // Handle error during approval
                console.error("Error approving user:", error);
                const title = $translate.instant('settings.pending.approve_failed_title');
                const msg = $translate.instant('settings.pending.approve_failed_message', { username: pendingUser.username, error: error.data ? error.data.message : 'Unknown error' });
                const btns = [{ result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-danger' }];
                $dialog.messageBox(title, msg, btns);
            });
        } else {
            // Should not happen based on the filter, but handle defensively
            console.warn("Attempting to approve a non-pending user:", pendingUser);
        }
    };

    /**
     * Reject a pending user (delete user).
     */
    $scope.rejectUser = function(pendingUser) {
        const title = $translate.instant('settings.pending.reject_user_title');
        const msg = $translate.instant('settings.pending.reject_user_message', { username: pendingUser.username });
        const btns = [
            { result:'cancel', label: $translate.instant('cancel') },
            { result:'ok', label: $translate.instant('ok'), cssClass: 'btn-danger' }
        ];

        $dialog.messageBox(title, msg, btns, function (result) {
            if (result === 'ok') {
                Restangular.one('user', pendingUser.username).remove().then(function () {
                    $scope.loadPendingUsers(); // Reload the list after deletion
                }, function(error) {
                    // Handle error during deletion
                    console.error("Error rejecting user:", error);
                    const title = $translate.instant('settings.pending.reject_failed_title');
                    const msg = $translate.instant('settings.pending.reject_failed_message', { username: pendingUser.username, error: error.data ? error.data.message : 'Unknown error' });
                    const btns = [{ result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-danger' }];
                    $dialog.messageBox(title, msg, btns);
                });
            }
        });
    };
});