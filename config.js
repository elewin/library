var config = require("./secrets.json"); // config file

module.exports = {
  serverPort: process.env.PORT || config.ServerPort,
  mongodb : {
    uri : process.env.MONGOLAB_URI || config.mongodb.uri,
    port: process.env.MONGOLAB_URI||  config.mongodb.port,
    db: process.env.MONGOLAB_URI || config.mongodb.db,
  },
  mongolab : {
    dbuser : process.env.MONGOLAB_URI || config.mongolab.dbuser,
    dbpassword: process.env.MONGOLAB_URI || config.mongolab.dbpassword,
    uriRoot : process.env.MONGOLAB_URI|| config.mongolab.uriRoot,
    uri: process.env.MONGOLAB_URI|| config.mongolab.uri,
    db: process.env.MONGOLAB_URI|| config.mongolab.db,
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
