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
  isbn13: {type: String,  default: "None", index: true},
  isbn10: {type: String, default: "None", index: true},
  publisher: {type: String,},
  tags: {type: []}, //genre etc
  coverArtUrl: {
    large: {type: String, default: ''},
    medium: {type: String, default: ''},
    small: {type: String, default: ''},
  },
  googDescription: {type: String, default: 'No description'}, //google books description
  azDescription: {type: String, default: 'No description'}, //amazon description
  lang: {type: String, default: "Not specified"},
  updatedAt: { type: Date, default: Date.now },
  dateAdded: { type: Date, default: Date.now},
  googBooksUrl: {type: String, default: ""},
  amazonUrl : {type: String, default: ""},
  thread: {type: []}, //discussion thread for this book
});

module.exports = mongoose.model('Book',bookSchema);
