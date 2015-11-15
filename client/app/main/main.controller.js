'use strict';

class MainController {

  constructor($http) {
    this.$http = $http;
    this.$http.get('/api/movies').success(movies => {
      this.movies = movies;
    });
  }

  buildIndex() {
    this.$http.get('/api/buildIndex').success(() => {
      this.success = true;
    });
  }

  dropIndex() {
    this.$http.get('/api/dropIndex').success(() => {
      this.movies = [];
    });
  }

  ignoreFile(title) {

    var req = {
      method: 'PUT',
      url: '/api/ignoreMovie',
      data: { title: title }
    }

    this.$http(req);
  }
}
MainController.$inject = ['$http'];
angular.module('movieCrawler2App')
  .controller('MainCtrl', MainController);
