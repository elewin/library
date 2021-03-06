var mongoose = require('mongoose');
var bookSchema = require('./bookSchema');
var Book = mongoose.model('Book', bookSchema);

var librarySchema = new mongoose.Schema({
  ownerId: { type: String, default: "NONE", index: true},
  ownerFbId: { type: String, default: "NONE"},
  books:[{
    book: {
      bookData: {type: mongoose.Schema.Types.ObjectId, ref: 'Book', require: true, },
      bookCollectionId: {type: String}, //this is a string of the _id of the book from the main book collection. This will be used for searching within a user's library without having to populate it every time.
      status: { type: String, enum: ['read', 'unread', 'reading'], default: 'unread' }, //has the user read this book?
      own: { type: Boolean, default: false }, //does the user own this book?
      rating: {type: Number, default: 0}, //allow the user to rate the book
      lastPage: {type: Number, default: 0},
      notes: {type: []},
      updatedAt: { type: Date, default: Date.now },
      dateAdded: { type: Date, default: Date.now},
    },
  }],
  updatedAt: { type: Date, default: Date.now }
});

// librarySchema.pre('update', function(next){
//   this.updatedAt = new Date();
//   next();
// })

module.exports = mongoose.model('Library', librarySchema);

//structure:
// library
//  books []
//    book
//     bookData
//     status
//     own
//     rating
//     updated at
//     dateAdded
//   updated at
