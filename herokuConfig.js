//settings for heroku deployment
module.exports = {
  local: false,
  serverPort: process.env.PORT,
  //heroku will use its own mongolab settings
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
      callbackURL: 'https://bookcollectorapp.herokuapp.com/api/auth/fb/cb',
    },
    amazon: {
      key: process.env.amazon_key,
      secret: process.env.amazon_secret,
      tag: process.env.amazon_tag,
    },
  },
};
