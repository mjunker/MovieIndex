'use strict';
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var ignoreMovie = require('../ignoreMovie');
var MovieInfo = require('../../initDb').MovieInfo;

router.get('/', function (req, res, next) {
  MovieInfo.find(function(err, movieInfos) {
    movieInfos = _.sortBy(movieInfos, function (movie) {
      return movie.imdbRating;
    });

    movieInfos = movieInfos.reverse();
    res.json(movieInfos);
  });
});

module.exports = router;
