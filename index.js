//dependencies:
var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');  //for the mongodb database
//var bcrypt = require('bcrypt-nodejs');  //for encrypting passwords
//var request = require('request-promise'); //for making http requests

//controllers:
var bookCtrl = require('./server-assets/controllers/bookCtrl');
var userCtrl = require('./server-assets/controllers/userCtrl');
var libraryCtrl = require('./server-assets/controllers/libraryCtrl');
//var googBooksCtrl = require('./server-assets/controllers/googBooksCtrl');

//schema:
// var Book = require('./server-assets/models/bookSchema');
// var Library = require('./server-assets/models/librarySchema');
// var User = require('./server-assets/models/userSchema');

//addresses and ports:
var serverPort = 8080;
var dbPort = 27017;
var dbUri = 'mongodb://localhost:'+dbPort+'/library';

mongoose.Promise = require('q').Promise; //replace mongo promises w/ q library
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.json(), cors());

//API endpoints:
//books
app.get('/api/books', bookCtrl.getBooks);
app.get('/api/books/:id', bookCtrl.getBook);
app.post('/api/books', bookCtrl.addBook);
app.put('/api/books/:id', bookCtrl.editBook);
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


//server start-up:
//connect to db
mongoose.connect(dbUri, function(err){
  if(err){
    console.log('Unable to connect to '+dbUri);
    console.log('Error:', err.message);
  };
});
mongoose.connection.once('open', function(){
  console.log('database connected to ' + dbUri);
})

//start server
app.listen(serverPort, function(){
  console.log('Library server listening to port '+serverPort);
});
