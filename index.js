//dependencies:
var config = require("./config.json"); // config file
var express = require('express');
var session = require('express-session');
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');  //for the mongodb database
mongoose.Promise = require('q').Promise; //replace mongo promises w/ q library
var passport = require('passport'); //for OAuth
var FacebookStrategy = require('passport-facebook'); //for oauth via facebook

//dependencies unused in index.js, listing for reference:
//var request = require('request-promise'); //for making http requests
// var amazon = require('amazon-product-api');
// var graph = require('fbgraph'); //Facebook Graph API

//controllers:
var bookCtrl = require('./server-assets/controllers/bookCtrl');
var userCtrl = require('./server-assets/controllers/userCtrl');
var libraryCtrl = require('./server-assets/controllers/libraryCtrl');
var authCtrl = require('./server-assets/controllers/authCtrl');

//controllers currently unused in index.js, listing here for reference:
//var googBooksCtrl = require('./server-assets/controllers/googBooksCtrl');
//var amazonCtrl = require('./server-assets/controllers/amazonCtrl');
//var goodreadsCtrl = require('./server-assets/controllers/goodreadsCtrl');
//var fbCtrl = require('./server-assets/controllers/fbCtrl');

//schema: (unused in index.js, listing for reference)
// var Book = require('./server-assets/models/bookSchema');
// var Library = require('./server-assets/models/librarySchema');
// var User = require('./server-assets/models/userSchema');

//addresses and ports:
var serverPort = 8080; //port for server to listen to
var dbPort = 27017; //database port
var dbUri = 'mongodb://localhost:'+dbPort+'/library'; //URI for database

var app = express();
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.json(), cors());

//sessions for OAuth:
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

//OAuth via facebook using passport:
passport.use(new FacebookStrategy({
  clientID: config.api.facebook.clientID,
  clientSecret: config.api.facebook.clientSecret,
  callbackURL: 'http://localhost:'+serverPort+ '/api/auth/fb/cb',
}, function(token, refreshToken, profile, done){
  console.log('****',profile.id);
  userCtrl.loginFindUser(token, profile)
  .then(function(user){
    return done(null, user);
  });
  //console.log(user);
  //return done(null, profile);
}));
passport.serializeUser(function(user, done){
  done(null, user);
});
passport.deserializeUser(function(obj, done){
  done(null, obj);
});

var requireAuth = function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.status(401).end();
	}
	next();
};

//API endpoints:
//OAuth
app.get('/api/auth/fb/login', authCtrl.authenticate);
app.get('/api/auth/fb/cb', authCtrl.callback);

app.get('/api/auth/fb/logout', authCtrl.logout);

//books
app.get('/api/books',  bookCtrl.getBooks);
app.get('/api/books/:id', bookCtrl.getBook);
app.post('/api/books', requireAuth, bookCtrl.addBook);
app.put('/api/books/:id', requireAuth, bookCtrl.editBook);
app.get('/api/books/:id/azUpdate', requireAuth, bookCtrl.azUpdate); //update from Amazon API
app.delete('/api/books/:id', requireAuth, bookCtrl.deleteBook); //deletes the book from the database and then iterates through every library that contained a reference to it and removes that book from their books array

//users
app.get('/api/users/me', requireAuth, userCtrl.getCurrentUser);
app.get('/api/users', requireAuth, userCtrl.getUsers);
app.get('/api/users/:id', userCtrl.getUser);
app.post('/api/users', requireAuth, userCtrl.addUser);
app.put('/api/users/:id', requireAuth, userCtrl.editUser);
app.delete('/api/users/:id', requireAuth, userCtrl.deleteUser);

//library
app.get('/api/library/', requireAuth, libraryCtrl.getAllLibraries); //should be removed later, should only need to use getUserLibrary
app.get('/api/library/:id', requireAuth, libraryCtrl.getUserLibrary); //gets a specific library, id is libraryId
app.post('/api/library', requireAuth, libraryCtrl.addLibrary); //adds a library, should only be invoked when adding a user
app.put('/api/library/:id', requireAuth, libraryCtrl.editLibrary); //edits the library, to be used for properties other than the books array
app.put('/api/library/:id/add', requireAuth, libraryCtrl.addBookToLibrary); //adds a book to the library
app.put('/api/library/:id/remove', requireAuth, libraryCtrl.removeBookFromLibrary); //removes a book from the library
app.delete('/api/library/:id', requireAuth, libraryCtrl.deleteLibrary); //deletes the library, should only be invoked when deleting the user


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
