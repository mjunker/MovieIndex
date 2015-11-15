'use strict';

angular.module('movieCrawler2App')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl',
        controllerAs: 'mainCtrl'
      });
  });
