'use strict'
var Crawler = require("crawler");
var url = require('url');
var _ = require('lodash');
var fs = require('fs');
var request = require('request');
var MovieInfo = require('../../initDb').MovieInfo;

var express = require('express');
var router = express.Router();

var maxPagesToIndex = 30;

var imdbBaseUrl = 'http://www.imdb.com';

router.get('/', buildIndex);

function buildIndex() {

  let alreadyIndexedPages = [];
  let movies = {};


  var forumCrawler = new Crawler({
    maxConnections: 2,
    rateLimits: 500,
    cache: true,
    // This will be called for each crawled page
    callback: function (error, result, $) {
      // $ is Cheerio by default
      //a lean implementation of core jQuery designed specifically for the server
      $('a').each(function (index, a) {
        var linkText = $(a).text();
        var id = $(a).attr('id');
        var href = $(a).attr('href');
        if (_.includes(id, 'thread_title')) {
          handleThread(movies, linkText, href);
        }
        if (isIndexLink(href)) {
          var pageNumber = parseInt(href.split('index')[1].split('.html')[0]);
          if (!_.includes(alreadyIndexedPages, href) && pageNumber < maxPagesToIndex && _.endsWith(href, '.html')) {
            console.log('Adding page ' + pageNumber);
            alreadyIndexedPages.push(href);
            forumCrawler.queue(href);
          }
        }

      });
    }
  });


}

function handleThread(movies, linkText, href) {
  var yearCandidates = /\d\d\d\d/.exec(linkText);

  var year;
  if (!_.isNull(yearCandidates) && yearCandidates.length > 0) {
    year = yearCandidates[yearCandidates.length - 1];
  }

  var name = linkText.split('(')[0];
  name = name.split('720p')[0];
  name = name.split('1080p')[0];
  name = name.split(/\d\d\d\d/)[0];
  name = name.replace(/\./g, ' ');
  name = name.replace(/\s{2,}/g, ' ');
  name = _.trim(name);
  var normalizedName = name.replace(/\W/g, '').toLowerCase();



  if (_.isUndefined(movies[normalizedName])) {
    initMovieWithImdbResults(movies,name, normalizedName, href, year);
  } else {
    movies[normalizedName].links.push(href);
  }
}

function isIndexLink(href) {
  return !_.isUndefined(href) && ((href.indexOf('f89/index') > -1) || (href.indexOf('f125/index') > -1));
}


function downloadImage(downloadUrl, filename) {
  var download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  };

  download(downloadUrl, filename, function () {
    console.log('done');
  });
}


function getFileName(url) {
  return url.substring(url.lastIndexOf('/') + 1);

}
function loadImdbDetails($, movieInfo) {

  $('span[itemprop=ratingValue]').each(function (index, span) {
    var rating = $(span).text();
    if (!_.isUndefined(movieInfo.imdbRating)) {
      movieInfo.imdbRating = parseFloat(rating);
      console.log(movieInfo.title + ' found IMDB rating ' + rating);
    }

  });
  var imageLink = $($('#img_primary > div.image > a > img').first()).attr('src');
  if (!_.isUndefined(imageLink)) {
    var newPath = 'client/assets/images/' + getFileName(imageLink);
    console.log('Downloading file' + imageLink);
    downloadImage(imageLink, newPath);
    movieInfo.imageLink = 'assets/images/' + getFileName(imageLink);
  }


  movieInfo.description = $('p[itemprop=description]').first().text();
  saveToDatabase(movieInfo);
}


function saveToDatabase(movieInfo) {
  MovieInfo.count({normalizedName: movieInfo.normalizedName}, function (err, count) {
    if (count == 0) {
      console.log('saved to db')
      new MovieInfo(movieInfo).save();
    }
  });
}


function handleImdbSearchResult($, searchResult, movieInfo, imdbCrawler) {
  var linkText = $(searchResult).text();
  var id = $(searchResult).attr('id');
  var href = $(searchResult).attr('href');
  movieInfo.imdbLink = imdbBaseUrl + href;

  imdbCrawler.queue([{
    uri: 'http://www.imdb.com' + href,
    jQuery: true,
    callback: function (error, result, $) {

      if (!error) {
        loadImdbDetails($, movieInfo);

      }

    }
  }]);
}
function initMovieWithImdbResults(movies, name, normalizedName, href, yearInfo) {

  //
  var movieInfo = {
    title: name,
    normalizedName: normalizedName,
    imdbNr: '',
    imdbRating: 0.0,
    links: [href],
    year: yearInfo
  };
  movies[normalizedName] = movieInfo;

  var imdbCrawler = new Crawler({
    maxConnections: 5,
    rateLimits: 250,
    cache: true,
    // This will be called for each crawled page
    callback: function (error, result, $) {
      var firstResult = $('td.result_text > a').first();
      handleImdbSearchResult($, firstResult, movieInfo, imdbCrawler);
    }
  });
  imdbCrawler.queue('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(normalizedName) + '&s=all');


}


module.exports = router;


