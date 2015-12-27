//settings:
var config = require('./config'); //config file. ***** Change the bool variable 'local' in this file (config.js) to true for local developlemt, false for heroku deployment
var useMongolab = false; //use mongolab (true) or local mongodb (false) ***** must be set to true for heroku deployment!
var local = config.local;

//alert user to the current mode to asssit with debugging:
if (local) {
  console.log('Library server is running in local mode');
  if (useMongolab){
    console.log('Mongolab enabled');
  }
  else{
    console.log('Using local mongodb');
  }
}
else{
  console.log('**** Library server is NOT in local mode');
  if(!useMongolab){
  console.log('**** Running local mongodb in non-local mode!'); //give a warning if the server is started in non-local mode (heroku deployment etc) but mongolab is disabled
  }
}

//dependencies:
var express = require('express');
var session = require('express-session');
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');  //for the mongodb database
mongoose.Promise = require('q').Promise; //replace mongo promises w/ q library
var passport = require('passport'); //for OAuth
var FacebookStrategy = require('passport-facebook'); //for oauth via facebook

//dependencies unused in index.js but used elsewhere, listing for reference:
// var request = require('request-promise'); //for making http requests
// var amazon = require('amazon-product-api');
// var graph = require('fbgraph'); //Facebook Graph API

//controllers:
var bookCtrl = require('./server-assets/controllers/bookCtrl');
var userCtrl = require('./server-assets/controllers/userCtrl');
var libraryCtrl = require('./server-assets/controllers/libraryCtrl');
var authCtrl = require('./server-assets/controllers/authCtrl');

//controllers currently unused in index.js but used elsewhere, listing here for reference:
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
  if (local){
    dbUri = config.mongolab.uriRoot + config.mongolab.dbuser + ":" + config.mongolab.dbpassword + config.mongolab.uri + config.mongolab.db; //URI for mongolab
  }
  else{
    dbUri = process.env.MONGOLAB_URI; //heroku URI for mongolab
  }
}
else {
  dbUri = config.mongodb.uri + config.mongodb.port + config.mongodb.db; //URI for local database
}

var facebookCallbackURL;
if (local){
  facebookCallbackURL = 'http://localhost:'+serverPort+ '/api/auth/fb/cb'; //this is for local development
}
else{
  facebookCallbackURL = config.api.facebook.callbackURL; //this is for deployment to heroku
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

//given a user and a role, return true or false if that user has that role in their role array
var userRole = function(user, role){
  if (user.roles.indexOf(role) > -1) { //check if the necessary role is in the user's roles array
    return true;
  }
  else{
    return false;
  }
};

var requireAdmin = function(req,res,next){
  if (!userRole(req.user, 'admin')){
    return res.status(403).end(); //if the user is not an admin, return status 403 forbidden
  }
  next();
};

//API endpoints:
//OAuth
app.get('/api/auth/fb/login', authCtrl.authenticate);
app.get('/api/auth/fb/cb', authCtrl.callback);
app.get('/api/auth/fb/logout', authCtrl.logout);

//books (these apply to the main book roster, not a particluar user's library)
app.get('/api/books',  bookCtrl.getBooks);
//app.get('/api/books/:id', bookCtrl.getBook); //deprecated?
app.get('/api/books/azSearch', requireAuth, bookCtrl.azSearchForBook); //search the amazon API for a book given a search term and search paramter, eg: /api/books/azSearch?param=author&term=Homer *** deprecated, use unifiedSearch /api/books/search
app.get('/api/books/dbSearch', requireAuth, bookCtrl.dbSearchForBook); //search the book collection in our database for a book eg: /api/books/dbSearch?param=author&term=Thucydides *** deprecated, use unifiedSearch /api/books/search
app.get('/api/books/search', requireAuth, bookCtrl.unifiedSearch); //search both the database book collection and the amazon products API for a book. Eg api/books/search?param=title&term=iliad,
app.post('/api/books', requireAuth, bookCtrl.addBookByIsbn); //adds a Book to the main book roster given an ISBN in the req.body
app.put('/api/books/:id', requireAuth, requireAdmin, bookCtrl.editBook);
// app.get('/api/books/:id/azUpdate', requireAuth, bookCtrl.azUpdate); //update from Amazon API *** DEPRECATED, this is done automatically upon adding a book
app.delete('/api/books/:id', requireAuth, requireAdmin, bookCtrl.deleteBook); //deletes the book from the database and then iterates through every library that contained a reference to it and removes that book from their books array

//users
app.get('/api/users/isUserLoggedIn', userCtrl.isUserLoggedIn);
app.get('/api/users/currentUser',  requireAuth, userCtrl.getCurrentUser);
app.get('/api/users', requireAuth, requireAdmin, userCtrl.getUsers);
//app.get('/api/users/:id', userCtrl.getUser);
//app.post('/api/users', requireAuth, userCtrl.addUser);
app.put('/api/users/:id', requireAuth, userCtrl.editUser);
app.delete('/api/users/:id', requireAuth, requireAdmin, userCtrl.deleteUser);

//library
app.get('/api/library/user/:id', requireAuth, libraryCtrl.getUserLibraryByUserId); //returns the library assosiated with the given user id
app.get('/api/library/', requireAuth, requireAdmin, libraryCtrl.getAllLibraries); //should be removed later, should only need to use getUserLibrary
app.get('/api/library/:id', requireAuth, libraryCtrl.getUserLibrary); //gets a specific library, id is libraryId
app.post('/api/library', requireAuth, libraryCtrl.addLibrary); //adds a library, should only be invoked when adding a user
app.put('/api/library/:id', requireAuth, libraryCtrl.editLibrary); //edits the library, to be used for properties other than the books array
app.put('/api/library/:id/add', requireAuth, libraryCtrl.addBookToLibrary); //adds a book to the library
app.put('/api/library/:id/remove', requireAuth, libraryCtrl.removeBookFromLibrary); //removes a book from the library
app.delete('/api/library/:id', requireAuth, requireAdmin, libraryCtrl.deleteLibrary); //deletes the library, should only be invoked when deleting the user


//connect to database
mongoose.createConnection(dbUri, function(err){
  if(err){
    console.log('Unable to connect to '+ dbUri);
    console.log('Error:', err.message);
  }
});
mongoose.connection.once('open', function(){
  console.log('Database connected to ' + dbUri);
});

//start server
app.listen(serverPort, function(){
  console.log('Library server listening on port ' + serverPort);
});
