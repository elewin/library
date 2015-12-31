var mongoose = require('mongoose');

//this is an admin collection to keep track of and store administrative actions

var adminSchema = new mongoose.Schema({
  //an array of previously deleted books. Currently this just stores the name and ISBN, later make this an embeded copy of each Book so it can be completly undeleted if need be?
  deletedBooks: [],
  dbCreated: {type: Date, default: Date.now},
});

module.exports = mongoose.model('Admin',adminSchema);
