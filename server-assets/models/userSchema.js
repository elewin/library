var mongoose = require('mongoose');
var librarySchema = require('./librarySchema');


var userSchema = new mongoose.Schema({
  name: { type: String, index: true, lowercase: true },
  email: { type: String, required: true, index: true, unique: true},
  library: [librarySchema]
})

module.exports = mongoose.model('User', userSchema);
