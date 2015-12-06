var mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: {type: String},
  edition: {type: String},
  author: {type: String, required: true}, //change to array later for multiple authors
  date: {type: Date},
  isbn: {type: Number, required: true, unique: true},
  tags: {type: []}, //genre etc
  coverArtUrl: {type: String, default: ''},
  status: { type: String, enum: ['read', 'unread', 'reading'], default: 'unread' }, //has the user read this book?
  own: { type: Boolean, default: false }, //does the user own this book?
  rating: {type: Number} //allow the user to rate the book
});

module.exports = mongoose.model('Book',bookSchema);
