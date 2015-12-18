var config = require("./secrets.json"); // config file

module.exports = {
  serverPort: process.env.PORT || config.ServerPort,
  mongodb : {
    uri : config.mongodb.uri,
    port:  config.mongodb.port,
    db: config.mongodb.db,
  },
  mongolab : {
    dbuser : config.mongolab.dbuser,
    dbpassword: config.mongolab.dbpassword,
    uriRoot :config.mongolab.uriRoot,
    uri: config.mongolab.uri,
    db: config.mongolab.db,
  },
  session: {
    secret: process.env.session || config.session.secret,
  },
  api: {
    facebook: {
      clientID : process.env.facebook_client || config.api.facebook.clientID,
      clientSecret: process.env.facebook_secret || config.api.facebook.clientSecret,
    },
    amazon: {
      key: process.env.amazon_key || config.api.amazon.key,
      secret: process.env.amazon_secret || config.api.amazon.secret,
      tag: process.env.amazon_tag ||  config.api.amazon.secret,
    },
  },
};
