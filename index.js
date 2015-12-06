//dependencies:
var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

//controllers:
var bookCtrl = require('./server-assets/controllers/bookCtrl');

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

//books:
app.get('/api/books', bookCtrl.getBooks);
app.get('/api/books', bookCtrl.getBook);
app.post('/api/books', bookCtrl.addBook);
app.put('/api/books/:id', bookCtrl.editBook);
app.delete('/api/books/:id', bookCtrl.deleteBook);

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
