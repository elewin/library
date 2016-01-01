var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
  title: { type: String, default:'', index: true },
  subtitle: {type: String, default: '', index: true},
  edition: {type: String},
  authors: {type: [], index: true}, //change to array later for multiple authors
  editor: {type: String},
  publishDate: {type: String},
  publishPlaces: {type: []},
  length: {type: String},
  isbn: {type: String, required: true, unique: true, index: true},
  isbn13: {type: String,  default: "None", index: true},
  isbn10: {type: String, default: "None", index: true},
  dewyDec: {type: []},
  lcClass: {type: []},
  publisher: {type: String},
  tags: {type: [], index: true}, //genre etc
  coverArtUrl: {
    large: {type: String, default: ''}, //later replace these defaults with a placeholder image
    medium: {type: String, default: ''},
    small: {type: String, default: ''},
  },
  googDescription: {type: String,}, //google books description
  azDescription: {type: []}, //amazon description
  lang: {type: String},
  updatedAt: { type: Date, default: Date.now },
  dateAdded: { type: Date, default: Date.now},
  googBooksUrl: {type: String, default: ""},
  amazonUrl : {type: String, default: ""},
  thread: {type: []}, //discussion thread for this book
  numOwners: {type: Number, default: 0}, //the number of people who have this book in their library
  numOwnBook: {type: Number, default: 0}, //number of people who have marked this book as being owned
  numRead: {type: Number, default: 0}, //the number of people who have read this book
  numCurrentlyReading: {type: Number, default: 0}, //the number of people who have marked this book as being currently read
  numReviews : {type: Number, default: 0}, //the number of reviews this book has gotten
  totalScore : {type: Number, default: 0}, //total score based off of reviews
});

module.exports = mongoose.model('Book',bookSchema);
