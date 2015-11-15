var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');
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
  year: Number
});
var MovieInfo = mongoose.model('MovieInfo', movieInfoSchema);

module.exports.MovieInfo = MovieInfo;
module.exports.db = db;
