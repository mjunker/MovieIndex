'use strict';
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var MovieInfo = require('../../initDb').MovieInfo;



router.get('/', function (req, res, next) {
  MovieInfo.remove(function(err) {
    console.log(err);
  });
});

module.exports = router;
