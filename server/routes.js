'use strict';

var errors = require('./components/errors');
var path = require('path');

module.exports = function (app) {

  // Insert routes below
  app.use('/api/ignoreMovie', require('./api/ignoreMovie'));
  app.use('/api/movies', require('./api/movies'));
  app.use('/api/buildIndex', require('./api/buildIndex'));
  app.use('/api/dropIndex', require('./api/dropIndex'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};
