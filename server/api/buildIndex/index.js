'use strict'
var Crawler = require("crawler");
var url = require('url');
var _ = require('lodash');
var request = require('request');
var MovieInfo = require('../../initDb').MovieInfo;
var express = require('express');
var router = express.Router();

var maxPagesToIndex = 30;
var imdbBaseUrl = 'http://www.imdb.com';

router.get('/', buildIndex);

function initCrawler() {
  let alreadyIndexedPages = [];

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
          handleThread(linkText, href);
        }
        if (isIndexLink(href)) {
          var pageNumber = parseInt(href.split('index')[1].split('.html')[0]);
          if (!_.includes(alreadyIndexedPages, href) && pageNumber < maxPagesToIndex && _.endsWith(href, '.html')) {
            alreadyIndexedPages.push(href);
            forumCrawler.queue(href);
          }
        }
      });
    }
  });
  return forumCrawler;
}
function buildIndex() {
  let forumCrawler = initCrawler();
}

function handleThread(linkText, href) {
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
  initMovieWithImdbResults(name, normalizedName, href, year);
}

function isIndexLink(href) {
  return !_.isUndefined(href) && ((href.indexOf('f89/index') > -1) || (href.indexOf('f125/index') > -1));
}

function downloadImage(downloadUrl, movieInfo) {
  movieInfo.imageLink = downloadUrl;
}

function parseRating($, movieInfo) {
  $('span[itemprop=ratingValue]').each(function (index, span) {
    var rating = $(span).text();
    if (!_.isUndefined(movieInfo.imdbRating)) {
      movieInfo.imdbRating = parseFloat(rating);
    }

  });
}
function parseImdbNr($, movieInfo) {
  var imdbUrl = $($('head > link').first()).attr('href');

  var pathSegments = imdbUrl.split('/');
  movieInfo.imdbNr = pathSegments[pathSegments.length - 2];
}
function parseAndDownloadImage($, movieInfo) {
  var imageLink = $($('#img_primary > div.image > a > img').first()).attr('src');
  if (!_.isUndefined(imageLink)) {
    downloadImage(imageLink, movieInfo);
  }
}
function parseDescription(movieInfo, $) {
  movieInfo.description = $('p[itemprop=description]').first().text();
}
function loadImdbDetails($, movieInfo) {
  parseRating($, movieInfo);
  parseImdbNr($, movieInfo);
  parseAndDownloadImage($, movieInfo);
  parseDescription(movieInfo, $);
  saveToDatabase(movieInfo);
}

function saveToDatabase(movieInfo) {
  var predicate = {imdbNr: movieInfo.imdbNr};

  MovieInfo.count(predicate, function (err, count) {
    if (count == 0) {
      new MovieInfo(movieInfo).save();
    } else {
      MovieInfo.findOne(predicate, function (err, existingMovieInfo) {
        if (err) return handleError(err);
        if (!_.includes(existingMovieInfo.links, movieInfo.links[0])) {
          existingMovieInfo.links.push(movieInfo.links[0]);
          existingMovieInfo.lastUpdate = new Date();
          existingMovieInfo.save();
        }

      })
    }
  });
}

function handleImdbSearchResult($, searchResult, movieInfo, imdbCrawler) {
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
function initMovieWithImdbResults(name, normalizedName, href, yearInfo) {

  var movieInfo = {
    title: name,
    normalizedName: normalizedName,
    imdbNr: '',
    imdbRating: 0.0,
    links: [href],
    year: yearInfo,
    firstSeen: new Date()
  };

  var imdbCrawler = new Crawler({
    maxConnections: 5,
    rateLimits: 250,
    cache: true,
    callback: function (error, result, $) {
      var firstResult = $('td.result_text > a').first();
      handleImdbSearchResult($, firstResult, movieInfo, imdbCrawler);
    }
  });
  imdbCrawler.queue('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(normalizedName) + '&s=all');
}

module.exports = router;


