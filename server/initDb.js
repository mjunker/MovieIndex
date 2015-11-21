var mongoose = require('mongoose');
var config = require('./config/environment');


mongoose.connect(config.mongoUrl + '/movies');
var db = mongoose.connection;

db.once('open', function (callback) {

});
db.on('error', console.error.bind(console, 'connection error:'));

var movieInfoSchema = mongoose.Schema({
  title: String,
  normalizedName: String,
  imdbNr: String,
  imdbLink: String,
  imageLink: String,
  description: String,
  imdbRating: Number,
  links: [String],
  image: String,
  year: Number
});
var MovieInfo = mongoose.model('MovieInfo', movieInfoSchema);


var ignoredMovieSchema = mongoose.Schema({
  imdbNr: String,
  reason: String,
});
var IgnoredMovie = mongoose.model('IgnoredMovie', ignoredMovieSchema);

module.exports.MovieInfo = MovieInfo;
module.exports.IgnoredMovie = IgnoredMovie;
module.exports.db = db;
