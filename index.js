//settings:
var config = require('./config'); //config file. Change the bool variable 'local' in this file to true for local developlemt, false for heroku deployment
var local = config.local;
var useMongolab = true; //use mongolab (true) or local db (false) (must be true for heroku deployment!)

//dependencies:
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
var serverPort = config.serverPort; //port for server to listen to

var dbUri;
if (useMongolab){
  dbUri = process.env.MONGOLAB_URI || config.mongolab.uriRoot + config.mongolab.dbuser + ":" + config.mongolab.dbpassword + config.mongolab.uri + config.mongolab.db; //URI for mongolab
} else {
  dbUri = config.mongodb.uri + config.mongodb.port + config.mongodb.db; //URI for local database
}

var facebookCallbackURL;
if (local){
  facebookCallbackURL = 'http://localhost:'+serverPort+ '/api/auth/fb/cb'; //this is for local development
}else{
  facebookCallbackURL = 'https://bookcollectorapp.herokuapp.com/api/auth/fb/cb'; //this is for deployment to heroku
}

mongoose.connect(dbUri);
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
  callbackURL: facebookCallbackURL,
  enableProof: true,
}, function(token, refreshToken, profile, done){
  userCtrl.findUserAndLogin(token, profile)
  .then(function(user){
    return done(null, user);
  });
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
app.get('/api/library/user/:id', libraryCtrl.getUserLibraryByUserId); //returns the library assosiated with the given user id
app.get('/api/library/', requireAuth, libraryCtrl.getAllLibraries); //should be removed later, should only need to use getUserLibrary
app.get('/api/library/:id', requireAuth, libraryCtrl.getUserLibrary); //gets a specific library, id is libraryId
app.post('/api/library', requireAuth, libraryCtrl.addLibrary); //adds a library, should only be invoked when adding a user
app.put('/api/library/:id', requireAuth, libraryCtrl.editLibrary); //edits the library, to be used for properties other than the books array
app.put('/api/library/:id/add', requireAuth, libraryCtrl.addBookToLibrary); //adds a book to the library
app.put('/api/library/:id/remove', requireAuth, libraryCtrl.removeBookFromLibrary); //removes a book from the library
app.delete('/api/library/:id', requireAuth, libraryCtrl.deleteLibrary); //deletes the library, should only be invoked when deleting the user

//server start-up:
if (local) {
  console.log('Library server is running in local mode');
}else{
  console.log('**** Library server is NOT in local mode');
}

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
app.listen(process.env.PORT || serverPort, function(){
  console.log('Library server listening to port '+serverPort);
});
