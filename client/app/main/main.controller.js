'use strict';

class MainController {

  constructor($http) {
    this.$http = $http;
    this.$http.get('/api/movies').success(movies => {
      this.movies = movies;
    });
    this.sortBy = '-firstSeen';
  }

  sortMovies(order) {
    this.sortBy = order;
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

  ignoreFile(imdbNr, reason) {
    console.log('ignore ' + imdbNr);


    var req = {
      method: 'PUT',
      url: '/api/ignoreMovie',
      data: { imdbNr: imdbNr, reason: reason }
    }

    this.$http(req).then(() => {
      this.movies.splice(_.findIndex(this.movies, {imdbNr: imdbNr}), 1);
    });
  }
}
MainController.$inject = ['$http'];
angular.module('movieCrawler2App')
  .controller('MainCtrl', MainController);
