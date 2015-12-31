var mongoose = require('mongoose');
var Admin = require('../models/adminSchema');

//set how many books we want to keep in the delteted book history
var deleteBookHistoryLength = 10;

module.exports = {

  //this should only be run once to get the admin collection built
  createAdminDb: function(req, res){
    Admin.find().exec().then(function(result){
      console.log(result.length);
      if(result.length === 0){ //if there is not an existing admin db, make one
        newAdmin = new Admin({

        });
        newAdmin.save();
        return res.status(201).end();
      }else{
        return res.status(409).end();
      }
    }).catch(function(err){
      console.log(err);
      return res.status(500).end();
    });
  },

  //add to the deleted book history
  addDeletedBook: function(deletedBook){
    Admin.findOne().exec().then(function(result){
      if (result){
        result.deletedBooks.push(deletedBook);
        if(result.deletedBooks.length > deleteBookHistoryLength){ //check if we're at the max size
          result.deletedBooks.shift(); //if so get rid of the oldest element
        }
        result.save();
      }
    }).catch(function(err){
      console.log(err);
    });
  },

};
