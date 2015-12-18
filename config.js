var local = true; //use settings for local developlemt. Change to false when deploying to heroku

var config;
if (local){
  config = require("./secrets.json"); // local config file
}else{
  config = require("./herokuConfig.json"); // config file with heroku environmental variables
}

module.exports = config;
