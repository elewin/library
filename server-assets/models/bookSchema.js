var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  subtitle: {type: String},
  edition: {type: String},
  author: {type: String, required: true, index: true}, //change to array later for multiple authors
  date: {type: Date},
  isbn: {type: Number, required: true, unique: true, index: true},
  tags: {type: []}, //genre etc
  coverArtUrl: {type: String, default: ''},
  updatedAt: { type: Date, default: Date.now },
  dateAdded: { type: Date, default: Date.now},
});

module.exports = mongoose.model('Book',bookSchema);
