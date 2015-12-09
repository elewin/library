var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  subtitle: {type: String},
  edition: {type: String},
  author: {type: String, required: true, index: true}, //change to array later for multiple authors
  editor: {type: String},
  date: {type: Date},
  length: {type: String,},
  isbn: {type: String, required: true, unique: true, index: true},
  publisher: {type: String,},
  tags: {type: []}, //genre etc
  coverArtUrl: {type: String, default: ''},
  summary: {type: String, default: 'No summary'},
  updatedAt: { type: Date, default: Date.now },
  dateAdded: { type: Date, default: Date.now},
});

module.exports = mongoose.model('Book',bookSchema);
