var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
  title: { type: String, default:'', index: true },
  subtitle: {type: String, default: '', index: true},
  edition: {type: String},
  authors: {type: [], index: true}, //change to array later for multiple authors
  editor: {type: String},
  publishDate: {type: String, default: "No date given"},
  publishPlaces: {type: []},
  copyrightDate: {type: String},//, default: "No date given"},
  length: {type: String, default: "Unknown"},
  isbn: {type: String, required: true, unique: true, index: true},
  isbn13: {type: String,  default: "None", index: true},
  isbn10: {type: String, default: "None", index: true},
  publisher: {type: String, default: "Unknown"},
  tags: {type: [], index: true}, //genre etc
  coverArtUrl: {
    large: {type: String, default: ''}, //later replace these defaults with a placeholder image
    medium: {type: String, default: ''},
    small: {type: String, default: ''},
  },
  googDescription: {type: String, default: 'No description'}, //google books description
  azDescription: {type: String, default: 'No description'}, //amazon description
  olDescription: {type: String, default: 'No description'}, //open library description
  lang: {type: String, default: "Not specified"},
  updatedAt: { type: Date, default: Date.now },
  dateAdded: { type: Date, default: Date.now},
  googBooksUrl: {type: String, default: ""},
  amazonUrl : {type: String, default: ""},
  thread: {type: []}, //discussion thread for this book
});

module.exports = mongoose.model('Book',bookSchema);
