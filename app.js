var express = require("express");
var path    = require("path");
var validator = require("validator");
var mongoose = require( 'mongoose' );
var autoIncrement = require("mongodb-autoincrement");

var app = express();
var port = process.env.PORT || 8060;

// ENDPOINTS

app.get('/', function (req, res) {
	console.log("=== reaching home")
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/make/:input', function(req, res) {
	console.log("=== reaching make")
	var original = req.params.input;
  if (validator.isURL(original)){
  	var submission = new Link({original:original});
		submission.save(function (err, data) {
  		if (err) {
  			console.log("link create error: ", err);
  		} else {
  			console.log("data returned when creating new link: ", data);
  			res.json({"original":data.original,"shortened":data.shortened});
  		}
		})
  } else {
  	res.json({"original":original,"shortened":"ERROR - not a valid URL"});
  }
});

// DATABASE

if(!process.env.URI){
  var uri = require( './uri' ).uri;
} else {
  var uri = process.env.URI;
}

mongoose.connect(uri);

autoIncrement.setDefaults({ field: "shortened" });

var linkSchema = mongoose.Schema({
  original: String,
  shortened: Number
});

linkSchema.plugin(autoIncrement.mongoosePlugin);

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
  console.log('Example app listening on port ' + port);
});
