'use strict';
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var ignoreMovie = require('../ignoreMovie');
var MovieInfo = require('../../initDb').MovieInfo;
var IgnoredMovie = require('../../initDb').IgnoredMovie;

router.get('/', function (req, res, next) {

  IgnoredMovie.find(function (err, ignoredMovies) {
    MovieInfo.find(function (err, movieInfos) {

      movieInfos = _.filter(movieInfos, function(movieInfo) {
         return !_.some(ignoredMovies, {imdbNr: movieInfo.imdbNr})
      });
      movieInfos = _.sortBy(movieInfos, function (movie) {
        return movie.imdbRating;
      });


      movieInfos = movieInfos.reverse();
      res.json(movieInfos);
    });
  });


});

module.exports = router;
