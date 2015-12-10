var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
  title: { type: String, default:'', index: true },
  subtitle: {type: String},
  edition: {type: String},
  author: {type: String, default:'', index: true}, //change to array later for multiple authors
  editor: {type: String},
  date: {type: String},
  length: {type: String,},
  isbn: {type: String, required: true, unique: true, index: true},
  publisher: {type: String,},
  tags: {type: []}, //genre etc
  coverArtUrl: {type: String, default: ''},
  summary: {type: String, default: 'No summary'},
  lang: {type: String},
  updatedAt: { type: Date, default: Date.now },
  dateAdded: { type: Date, default: Date.now},
  googBooksUrl: {type: String},
});

module.exports = mongoose.model('Book',bookSchema);
