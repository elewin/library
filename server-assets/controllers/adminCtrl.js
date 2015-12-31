var mongoose = require('mongoose');
var Admin = require('../models/adminSchema');

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
  }
};
