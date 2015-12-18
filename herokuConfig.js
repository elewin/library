//settings for heroku deployment
module.exports = {
  local: false,
  serverPort: process.env.PORT,
  mongodb : {
    uri : "",
    port: "",
    db: "",
  },
  mongolab : {
    dbuser : "",
    dbpassword: "",
    uriRoot : "",
    uri: "",
    db: "",
  },
  session: {
    secret: process.env.session,
  },
  api: {
    facebook: {
      clientID : process.env.facebook_client,
      clientSecret: process.env.facebook_secret,
    },
    amazon: {
      key: process.env.amazon_key,
      secret: process.env.amazon_secret,
      tag: process.env.amazon_tag,
    },
  },
};
