//dependencies:
var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

//controllers:
var bookCtrl = require('./server-assets/controllers/bookCtrl');
var userCtrl = require('./server-assets/controllers/userCtrl');
var libraryCtrl = require('./server-assets/controllers/libraryCtrl');

//schema:
var Book = require('./server-assets/models/bookSchema');

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
app.delete('/api/books/:id', bookCtrl.deleteBook);

//users
app.get('/api/users', userCtrl.getUsers);
app.get('/api/users/:id', userCtrl.getUser);
app.post('/api/users', userCtrl.addUser);
app.put('/api/users/:id', userCtrl.editUser);
app.delete('/api/users/:id', userCtrl.deleteUser);

//library
// ****move this to within each user instead of its own thing? eg /api/users/id/library
//also, library needs to be added when new user is created. see todo
//app.get('/api/library/:id', libraryCtrl.getLibrary);

// app.post('/api/user/:id/library', libraryCtrl.addLibraryToUser); //?????

app.get('/api/library/', libraryCtrl.getAllLibraries); //should be removed later
app.get('/api/library/:id', libraryCtrl.getUserLibrary);
app.post('/api/library', libraryCtrl.addLibrary);
app.put('/api/library/:id', libraryCtrl.editLibrary);
app.delete('/api/library/:id', libraryCtrl.deleteLibrary);

//server start-up:
//connect to db
mongoose.connect(dbUri, function(err){
  if(err){
    console.log('Unable to connect to '+dbUri);
    console.log(err.message);
  };
});
mongoose.connection.once('open', function(){
  console.log('database connected to ' + dbUri);
})
//start server
app.listen(serverPort, function(){
  console.log('Library server listening to port '+serverPort);
});
