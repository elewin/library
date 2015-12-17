var mongoose = require('mongoose');
var librarySchema = require('./librarySchema');

var userSchema = new mongoose.Schema({
  name: { type: String, required: true, }, //index: true},
  email: { type: String,  lowercase: true, },//unique: true, }, //index: true, required: true,},
  library: {type: mongoose.Schema.Types.ObjectId, ref: "Library"},
  fb: { //facebook data
    id: {type: String}, //facebook id
    token: {type: String},
  },
  role: {type: String, enum: ['user', 'admin'], default: 'user'}, //level of access
});

module.exports = mongoose.model('User', userSchema);
