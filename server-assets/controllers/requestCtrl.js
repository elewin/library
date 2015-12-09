var request = require('request');

module.exports = {

  //get book info by ISBN. ex: requestCtrl.lookUpIsbn('1416590870')
  lookUpIsbn: function(isbn){
    request({
      method: 'GET',
      uri: 'https://www.googleapis.com/books/v1/volumes?q=isbn:'+isbn,
    },
    function(err, res, body){
      if (res.statusCode === 200){
        return(body);
      };
      if (!err && res.statusCode !== 200){

        console.log('*** requestCtrl.lookUpIsbn:',this.method,'request for', this.uri.href, 'returned status code:', res.statusCode);
        return;
      };
      if (err || res.statusCode !== 200){
        console.log('lookUpIsbn had an error. Response:', res.statusCode);
        console.log('Error:', err);
        return;
      };
    });
  },

};
