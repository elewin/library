//dependencies:
var config = require("./config.json"); // config file
var express = require('express');
var session = require('express-session');
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');  //for the mongodb database
var passport = require('passport'); //for OAuth
var FacebookStrategy = require('passport-facebook'); //for oauth via facebook
//var request = require('request-promise'); //for making http requests
// var amazon = require('amazon-product-api');

//controllers:
var bookCtrl = require('./server-assets/controllers/bookCtrl');
var userCtrl = require('./server-assets/controllers/userCtrl');
var libraryCtrl = require('./server-assets/controllers/libraryCtrl');
var authCtrl = require('./server-assets/controllers/authCtrl');
//var googBooksCtrl = require('./server-assets/controllers/googBooksCtrl');
var amazonCtrl = require('./server-assets/controllers/amazonCtrl');
//var goodreadsCtrl = require('./server-assets/controllers/goodreadsCtrl');

//schema:
// var Book = require('./server-assets/models/bookSchema');
// var Library = require('./server-assets/models/librarySchema');
// var User = require('./server-assets/models/userSchema');

//addresses and ports:
var serverPort = 8080; //port for server to listen to
var dbPort = 27017; //database port
var dbUri = 'mongodb://localhost:'+dbPort+'/library'; //URI for database

var app = express();

mongoose.Promise = require('q').Promise; //replace mongo promises w/ q library

app.use(express.static(__dirname+"/public"));
app.use(bodyParser.json(), cors());

//sessions for OAuth:
app.use(session({
  secret: config.session,
  resave: false,
  saveUninitialized: false,
}));

//OAuth via facebook using passport:
app.use(passport.initialize());
app.use(passport.session());
passport.use(new FacebookStrategy({
  clientID: config.api.facebook.clientID,
  clientSecret: config.api.facebook.clientSecret,
  callbackURL: 'http://localhost:'+serverPort+ '/api/auth/fb/cb',
}, function(token, refreshToken, profile, done){
  return done(null, profile);
}));
passport.serializeUser(function(user, done){
  done(null, user);
});
passport.deserializeUser(function(obj, done){
  done(null, obj);
});

//API endpoints:
//OAuth

app.get('/api/auth/fb', authCtrl.authenticate);
app.get('/api/auth/fb/cb', authCtrl.callback);
app.get('/api/auth/fb/profile', authCtrl.getProfile);

//books
app.get('/api/books', bookCtrl.getBooks);
app.get('/api/books/:id', bookCtrl.getBook);
app.post('/api/books', bookCtrl.addBook);
app.put('/api/books/:id', bookCtrl.editBook);
app.get('/api/books/:id/azUpdate', bookCtrl.azUpdate); //update from Amazon API
app.delete('/api/books/:id', bookCtrl.deleteBook); //deletes the book from the database and then iterates through every library that contained a reference to it and removes that book from their books array

//users
app.get('/api/users', userCtrl.getUsers);
app.get('/api/users/:id', userCtrl.getUser);
app.post('/api/users', userCtrl.addUser);
app.put('/api/users/:id', userCtrl.editUser);
app.delete('/api/users/:id', userCtrl.deleteUser);

//library
app.get('/api/library/', libraryCtrl.getAllLibraries); //should be removed later, should only need to use getUserLibrary
app.get('/api/library/:id', libraryCtrl.getUserLibrary); //gets a specific library, id is libraryId
app.post('/api/library', libraryCtrl.addLibrary); //adds a library, should only be invoked when adding a user
app.put('/api/library/:id', libraryCtrl.editLibrary); //edits the library, to be used for properties other than the books array
app.put('/api/library/:id/add', libraryCtrl.addBookToLibrary); //adds a book to the library
app.put('/api/library/:id/remove', libraryCtrl.removeBookFromLibrary); //removes a book from the library
app.delete('/api/library/:id', libraryCtrl.deleteLibrary); //deletes the library, should only be invoked when deleting the user


//amazonCtrl.searchByIsbn('9780804139038');

//server start-up:
//connect to db
mongoose.connect(dbUri, function(err){
  if(err){
    console.log('Unable to connect to '+dbUri);
    console.log('Error:', err.message);
  }
});
mongoose.connection.once('open', function(){
  console.log('database connected to ' + dbUri);
});

//start server
app.listen(serverPort, function(){
  console.log('Library server listening to port '+serverPort);
});
