'use strict';
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var IgnoredMovie = require('../../initDb').IgnoredMovie;


router.put('/', function (req, res, next) {
  new IgnoredMovie({
    imdbNr: req.body.imdbNr,
    reason: req.body.reason
  }).save();
  res.sendStatus(200)
});

module.exports = router;
