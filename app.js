var express = require("express");
var path    = require("path");
var validator = require("validator");
var mongoose = require( 'mongoose' );
var sequence = require('mongoose-sequence');

var app = express();
var port = process.env.PORT || 8060;

if(!process.env.MONGODB_URI){
  var uri = require( './uri' ).uri;
} else {
  var uri = process.env.MONGODB_URI;
}

mongoose.connect(uri);

// ENDPOINTS

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/favicon.ico', function(req, res) {
  res.sendStatus(200);
});

app.get('/make/*', function(req, res) {
  var original = req.url.slice(6);
  if (validator.isURL(original)){
    var regexhttp = new RegExp("^(http|https)://", "i");
    if (!regexhttp.test(original)) {
      original = "http://" + original;
    }
    var submission = new Link({original:original});
    submission.save(function (err, data) {
      if (err) {
        console.log("link submission error: ", err);
      } else {
        res.json({
          "original": data.original,
          "shortened": "https://szurl.herokuapp.com/go/" + data.shortened
        });
      }
    })
  } else {
    res.json({"original":original,"shortened":"ERROR - not a valid URL"});
  }
});
 
app.get('/go/:short', function(req, res) {
  var short = req.params.short;
  Link.findOne({'shortened': short}, function (err, data) {
    if (err) {
      console.log("link redirect error: ", err);
    } else {
      res.redirect(301, data.original);
    }
  })
});

app.use(function(req, res, next) {
  res.status(404).send('Error 404');
});

// DATABASE

var linkSchema = mongoose.Schema({
  original: String
});
linkSchema.plugin(sequence, {inc_field: 'shortened'});
var Link = mongoose.model('Link', linkSchema);

// Connection Events

mongoose.connection.on('connected', function(){
  console.log('Mongoose db connection established with uri:' + uri + "===");
})

mongoose.connection.on('error', function(err){
  console.error('Error with mongoose db connection: ' + err + "===");
})

mongoose.connection.on('disconnected', function(){
  console.log('Mongoose db has been disconnected.');
})

// SERVER

app.listen(port, function () {
  console.log('SZURL app listening on port ' + port);
});
