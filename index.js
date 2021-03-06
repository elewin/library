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

//controllers:
var bookCtrl = require('./server-assets/controllers/bookCtrl');
var userCtrl = require('./server-assets/controllers/userCtrl');
var libraryCtrl = require('./server-assets/controllers/libraryCtrl');
var authCtrl = require('./server-assets/controllers/authCtrl');
var adminCtrl = require('./server-assets/controllers/adminCtrl');

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

//books (these apply to the main book collection, not a particluar user's library. See library endpoints for that)
app.get('/api/books/all', requireAuth, requireAdmin, bookCtrl.getAllBooks); //should only be used for dev/admin/debugging purposes
app.get('/api/books', bookCtrl.getBook); //gets a book given a query of ?isbn=<isbn>
app.get('/api/books/search',  bookCtrl.search); //search both the database book collection and the amazon products API for a book. Eg api/books/search?param=title&term=iliad,
app.get('/api/books/amazon', bookCtrl.getAzBookByIsbn); //get as search result from the amazon products api given an isbn, eg ?isbn=123456789 (used for book preview)
app.post('/api/books', requireAuth, bookCtrl.addBookByIsbn); //adds a Book to the main book roster given an ISBN in the req.body. Can also take a query that will add it to a user's library afterward, eg /api/books?libraryId=0123456789abc
app.put('/api/books/:id', requireAuth, requireAdmin, bookCtrl.editBook);
app.delete('/api/books/:id', requireAuth, requireAdmin, bookCtrl.deleteBook); //deletes the book from the database and then iterates through every library that contained a reference to it and removes that book from their books array

//users
app.get('/api/users/isUserLoggedIn', userCtrl.isUserLoggedIn); //checks if a user is logged in, retruns a bool
app.get('/api/users/currentUser',  requireAuth, userCtrl.getCurrentUser);
app.get('/api/users', requireAuth, requireAdmin, userCtrl.getUsers);
app.put('/api/users/:id', requireAuth, userCtrl.editUser);
app.delete('/api/users/:id', requireAuth, requireAdmin, userCtrl.deleteUser);

//library
app.get('/api/library/:id/bookCheck', requireAuth, libraryCtrl.doesUserHaveBook); //checks if an isbn exists in the user's library, returns a bool
app.get('/api/library/user/:id', requireAuth, libraryCtrl.getUserLibraryByUserId); //returns the library assosiated with the given user id
app.get('/api/library/', requireAuth, requireAdmin, libraryCtrl.getAllLibraries); //should be removed later, should only need to use getUserLibrary
app.get('/api/library/:id', requireAuth, libraryCtrl.getUserLibrary); //gets a specific library, id is libraryId
app.get('/api/library/:libraryId/:bookId', requireAuth, libraryCtrl.getBookFromLibrary); //gets a specific book from a library
app.post('/api/library', requireAuth, libraryCtrl.addLibrary); //adds a library, should only be invoked when adding a user
app.put('/api/library/:id', requireAuth, libraryCtrl.editLibrary); //edits the library, to be used for properties other than the books array
app.put('/api/library/edit/:libraryId/:bookId', requireAuth, libraryCtrl.editBookInLibrary); //edits user properties on a book in their library
app.put('/api/library/:id/add', requireAuth, libraryCtrl.addBookToLibrary); //adds a book to the library by either ISBN or bookId given a query. eg: /api/library/:id/add?isbn=9780142004371 or /api/library/:id/add?bookId=1234567890abc
app.put('/api/library/:id/remove', requireAuth, libraryCtrl.removeBookFromLibrary); //removes a book from the library
app.delete('/api/library/:id', requireAuth, requireAdmin, libraryCtrl.deleteLibrary); //deletes the library, should only be invoked when deleting the user

//admin
app.post('/api/admin/createDb', requireAuth, requireAdmin, adminCtrl.createAdminDb);
app.get('/api/admin/', requireAuth, requireAdmin, adminCtrl.getAdmin);


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
