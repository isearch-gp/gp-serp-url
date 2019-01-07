// index.js
// from https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

var gsr = require('./GoogleSearchResults');

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// pug stuff
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// static pages
app.use(express.static('public'));

/***
app.get('/', function (req, res) {
   res.send('Hello World');
})
***/

/***
// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {
   console.log("Got a GET request for the homepage");
   res.send('Hello GET');
})
***/

app.get('/', function (req, res) {

  //res.sendFile( __dirname + "/" + "search.html" ); // search = get
  //res.sendFile( __dirname + "/" + "search2.html" ); // search = post
  //res.sendFile( __dirname + "/" + "search3.html" ); // search = post
  res.render('search')
})

app.get('/process_get', function (req, res) {
   // Prepare output in JSON format
   response = {
      first_name:req.query.first_name,
      last_name:req.query.last_name
   };
   console.log(response);
   res.end(JSON.stringify(response));
})

// This responds a POST request for the homepage
app.post('/', function (req, res) {
   console.log("Got a POST request for the homepage");
   res.send('Hello POST');
})

app.post('/process_post', urlencodedParser, function (req, res) {
   // Prepare output in JSON format
   response = {
      query:req.body.query,
      //last_name:req.body.last_name
   };
   console.log(response);
   res.end(JSON.stringify(response));
})

app.post('/process_query', urlencodedParser, function (req, res) {
   // Prepare output in JSON format
   response = {
      query:req.body.query,
      //last_name:req.body.last_name
   };
   console.log(response);
    //let p = {q: "Coffee", location: "Austin, Texas"}
    //let p = {q: response.query, location: null} // num not allowed
    //let p = {q: response.query, location: null, hl: "en", gl: "us", num: 100} // coffee
    let p = {q: response.query, location: null, hl: "en", gl: "us"} // any
    let serp = new gsr.GoogleSearchResults("demo")
    //let serp = new gsr.GoogleSearchResults("test") // bad key

    try {
    serp.json(p, (data) => {
      //expect(data.local_results[0].title.length).toBeGreaterThan(5)
      //done()
      //res.end(JSON.stringify(data));
      //res.send(data);
      //res.json(data);
      let json_string = JSON.stringify(data);
      let related = data.related_searches;
      related.forEach((rel, index) => {
	    console.log(rel.query)
	    console.log(rel.link)
	      var new_link = rel.query.replace(/\s/g, '+');
            console.log(new_link);
	    rel.link = "/get_query/"+new_link;
      })
      let results = data.local_results;
      //console.log(data)
      res.render('search', {data:data, json:json_string, related_searches2:related})
      //res.sendFile( __dirname + "/" + "search3.html" ); // search = post
    })
   
   //res.end(JSON.stringify(response));
    } catch (ex) {
	console.log(ex.message);
	res.send(ex.message);
    }
})

app.get('/get_query/:q', function (req, res) {
   response = {
      query:req.params.q,
   };
   console.log(response);
    //let p = {q: response.query, location: null, hl: "en", gl: "us", num: 100} // coffee
    let p = {q: response.query, location: null} // any
    let serp = new gsr.GoogleSearchResults("demo")

    try {
    serp.json(p, (data) => {
      let json_string = JSON.stringify(data);
      let related = data.related_searches;
      related.forEach((rel, index) => {
	    console.log(rel.query)
	    console.log(rel.link)
	      var new_link = rel.query.replace(/\s/g, '+');
            console.log(new_link);
	    rel.link = "/get_query/"+new_link;
      })
      let results = data.local_results;
      //console.log(data)
      res.render('search', {data:data, json:json_string, related_searches2:related})
//    }, (err) => {
//	    console.log("ERROR "+err);
    })

    } catch (ex) {
	    console.log(ex.message);
	    res.send(ex.message);
    }
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})

