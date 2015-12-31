var mongoose = require('mongoose');

//this is an admin collection to keep track of and store administrative actions

var adminSchema = new mongoose.Schema({
  //an array of previously deleted books
  deletedBooks: [{
    book: {
      isbn: {type: String},
      name: {type: String},
      date: {type: Date, default: Date.now},
    }
  }],
  dbCreated: {type: Date, default: Date.now},
});

module.exports = mongoose.model('Admin',adminSchema);
