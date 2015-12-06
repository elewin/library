var mongoose = require('mongoose');
var librarySchema = require('./librarySchema');


var userSchema = new mongoose.Schema({
  name: { type: String, index: true, lowercase: true, required: true, },
  email: { type: String,  index: true, lowercase: true, unique: true, }, //required: true,},
  library: [librarySchema]
})

module.exports = mongoose.model('User', userSchema);
