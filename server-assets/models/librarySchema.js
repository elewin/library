var mongoose = require('mongoose');

var librarySchema = new mongoose.Schema({
  books: [{
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', require: true },
    quantity: { type: Number, min: 0, default: 1 }
  }],
  updatedAt: { type: Date, default: Date.now }
});

librarySchema.pre('update', function(next){
  this.updatedAt = new Date();
  next();
})

module.exports = librarySchema;
