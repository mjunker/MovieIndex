'use strict';
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var fs = require('fs');


let ignoredFiles = [];

fs.readFile('server/api/ignoreMovie/ignored.txt', {encoding: 'utf-8'}, function read(err, data) {
  if (err) {
    throw err;
  }
  ignoredFiles = data.split('\n');
});


router.put('/', function (req, res, next) {
  ignoredFiles.push(req.body.title);
  console.log(req.body.title);
  fs.appendFile('server/api/ignoreMovie/ignored.txt', req.body.title, 'utf8' );
  fs.appendFile('server/api/ignoreMovie/ignored.txt', '\n', 'utf8' );
});

module.exports = router;
