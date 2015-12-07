var mongoose = require('mongoose');
var librarySchema = require('./librarySchema');

var userSchema = new mongoose.Schema({
  name: { type: String,  lowercase: true, required: true, }, //index: true},
  email: { type: String,  lowercase: true, },//unique: true, }, //index: true, required: true,},
  library: {type: mongoose.Schema.Types.ObjectId, ref: "Library"},
})

module.exports = mongoose.model('User', userSchema);
