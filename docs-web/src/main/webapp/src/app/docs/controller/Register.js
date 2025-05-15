'use strict';

/**
 * Register controller.
 */
angular.module('docs').controller('Register', ['$scope', '$state', 'User', 'Restangular', function($scope, $state, User, Restangular) {

    $scope.user = {}; // 初始化用户对象

    // 注册方法
    $scope.register = function() {
        // 1. 尝试使用管理员账号登录
        User.login({ username: 'admin', password: 'admin' })
            .then(function() {
                // 2. 管理员登录成功，准备要创建的用户数据
                const newUser = {
                    username: $scope.user.username,
                    password: $scope.user.password,
                    email: 'pending' +$scope.user.email,
                    storage_quota:  102400000
                };

                // 3. 使用 Restangular 发送创建用户请求 (模拟 SettingsUserEdit 的添加逻辑)
                return Restangular.one('user').put(newUser);
            })
            .then(function(response) {
                // 4. 用户创建成功后，尝试登出管理员账号
                return User.logout().then(function() {
                    alert("提交注册申请成功！");
                    $state.go('login');
                }, function(logoutError) {
                    console.error("登出管理员失败:", logoutError);
                    alert("注册成功，但登出管理员失败！");
                    $state.go('login');
                });
            })
            .catch(function(error) {
                let errorMessage = "注册失败：";
                if (error && error.data && error.data.message) {
                    errorMessage += error.data.message;
                } else if (error && error.status === 403) {
                    errorMessage += "需要管理员权限，登录失败！";
                } else if (error && error.status === 404) {
                    errorMessage += "创建用户接口未找到！";
                } else {
                    errorMessage += "服务器错误";
                }
                alert(errorMessage);
            });
    };

}]);