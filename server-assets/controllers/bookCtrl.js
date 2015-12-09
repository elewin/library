var mongoose = require('mongoose'),
  Book = require('../models/bookSchema'),
  Library = require('../models/librarySchema');

module.exports = {
  addBook: function(req, res) {
    var newBook = new Book(req.body);
    newBook.save().then(function(doc) {
      return res.json(doc);
    }).catch(function(err) {
      console.log(err);
      return res.status(400).json(err);
    });
  },

  getBooks:  function(req, res) {
    Book.find(req.query).exec().then(function(docs) {
      return res.json(docs);
    }).catch(function(err) {
      return res.status(400).json(err);
    });
  },

  getBook: function(req, res){
    Book.findById(req.params.id, function(err){
      return res.json(docs);
    }).catch(function(err) {
      return res.status(400).json(err);
    });
  },

  editBook: function(req, res) {
    Book.findByIdAndUpdate(req.params.id, req.body, {new: true}).exec().then(function(doc) {
      return res.json(doc);
    }).catch(function(err) {
      console.log(err);
      return res.status(400).json(err);
    });
  },

  deleteBook: function(req, res) {
    Book.findByIdAndRemove(req.params.id, function(err, result){
      if(err){
        res.status(400).json(err);
      } else {
        Library.find({'books.book.bookData': req.params.id}).exec().then(function(docs) {
          //loop through the libraries that contain this book and splice it out
          for (var i = 0; i < docs.length; i++){
            for(var j = 0; j< docs[i].books.length; j++){
              if (docs[i].books[j].book.bookData == req.params.id){
                docs[i].books.splice(j,1);
              }
              docs[i].save();
            }
          }
        });
        res.json(result);
      };
    });
  }

  // archiveBook:  function(req, res) {
  //   Book.findById(req.params.id).exec().then(function(doc) {
  //     doc.status = 'archived';
  //     return doc.save().then(function(resu) {
  //       return res.json(resu);
  //     });
  //   }).catch(function(err) {
  //     return res.status(500).json(err);
  //   });
  // },
};
