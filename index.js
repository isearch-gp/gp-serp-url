// index.js
// from https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

//var serverPort = 8000;
// use port 3000 unless there exists a preconfigured port
var serverPort = process.env.PORT || 8081;
//var serverPort = app.get('PORT') || 8081;

var gsr = require('./GoogleSearchResults');
var googleIt = require('./GoogleIt');

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(bodyParser.json({
    limit: '50mb'
}));

// pug stuff
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// static pages
app.use(express.static('public'));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

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
  res.render('index')
})

app.get('/search', function (req, res) {
  res.render('search')
})

app.get('/search-git', function (req, res) {
  res.render('search-git')
})

app.get('/search-googler', function (req, res) {
  res.render('search-googler')
})

// Get
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

// Post
app.post('/process_post', urlencodedParser, function (req, res) {
   // Prepare output in JSON format
   response = {
      query:req.body.query,
      //last_name:req.body.last_name
   };
   console.log(response);
   res.end(JSON.stringify(response));
})

// SERP API Post (from search.pug)
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
      //
      // add error checking
      if (data.error) {
	console.log(data.error);
	//res.end(data.error);
	res.render('search', {data:data})
	return
      }
      let json_string = JSON.stringify(data);
      let related = data.related_searches;
      related.forEach((rel, index) => {
	    //console.log(rel.query)
	    //console.log(rel.link)
	      var new_link = rel.query.replace(/\s/g, '+');
            //console.log(new_link);
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
	res.end(ex.message);
    }
})

// SERP API Get (from search.pug) for related searches only
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
      // add error checking
      if (data.error) {
	console.log(data.error);
	//res.end(data.error);
	res.render('search', {data:data})	
	return
      }
      let json_string = JSON.stringify(data);
      let related = data.related_searches;
      related.forEach((rel, index) => {
	    //console.log(rel.query)
	    //console.log(rel.link)
	      var new_link = rel.query.replace(/\s/g, '+');
            //console.log(new_link);
	    rel.link = "/get_query/"+new_link;
      })
      let results = data.local_results;
      //console.log(data)
      res.render('search', {data:data, json:json_string, related_searches2:related})
    }, (err) => {
	    console.log("ERROR "+err.message);
	    res.send(err.message);
    })

    } catch (ex) {
	    console.log(ex.message);
	    res.send(ex.message);
    }
})

// Node JS Web scraper (git) Post from (search_git.pug)
app.post('/process_git', urlencodedParser, function (req, res) {
   // Prepare output in JSON format
   response = {
      query:req.body.query,
      //last_name:req.body.last_name
   };
   console.log(response);
   // let p = {q: response.query, location: null, hl: "en", gl: "us"} // any

   // with request options
   const options = {
     'disableConsole ': true
   };
   
   googleIt(options, {'query': response.query }).then(results => {
   // access to results object here
       let json_string = JSON.stringify(results);
       console.log(results);

       res.render('search-git', {data:results, json:json_string})
      //res.sendFile( __dirname + "/" + "search3.html" ); // search = post

   }).catch(e => {
   // any possible errors that might have occurred (like no Internet connection)
     	console.log(e.message);
	res.send(e.message);
   })
})

// Python Web scraper (googler) Post from (search_googler.pug)
app.post('/process_googler', urlencodedParser, function (req, res) {
   response = {
      query:req.body.query,
   };
   console.log(response);
   // let p = {q: response.query, location: null, hl: "en", gl: "us"} // any
/***
   googleIt(options, {'query': response.query }).then(results => {
   // access to results object here
       let json_string = JSON.stringify(results);
       console.log(results);
       res.render('googler', {data:results, json:json_string})

   }).catch(e => {
   // any possible errors that might have occurred (like no Internet connection)
     	console.log(e.message);
	res.send(e.message);
   })
***/
   data = {
     error: "Python API not yet available",
     query: response.query,
   };
   res.render('search-googler', {data:data})
})


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


//var server = app.listen(8081, function () {
var server = app.listen(serverPort, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)

   console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
})

