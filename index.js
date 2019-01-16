'use strict';
// index.js
// from https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
const request = require('request');
const minimist = require('minimist');

var gsr = require('./GoogleSearchResults');
var googleIt = require('./GoogleIt');

const process_name = process.argv[0]
let args = minimist(process.argv.slice(2), {  
    alias: {
	a: 'api',
        h: 'help',
        p: 'port',
        v: 'verbose'
    },
    default: {
        api: 'http://127.0.0.1:5000',
        help: false,
        port: 8081,
	verbose: 0
    },
    
});
if (args.verbose) {
   console.log('args:', args);
}

if (args.help){
    console.log(process_name+": a simple set of Google Search proxies\n"+
       "\tOptions:\n"+ 
       "\t-a --api API_URL_with_port\n"+
       "\t-h --help this message\n"+
       "\t-p --port local port to listen on (default 8081)\n"+
       "\t-v --verbose (+3 for lots)\n")
    process.exit();
}

console.log('Using port', args.port);
console.log('Using API URL of: ', args.api);



//var serverPort = 8081;
// use port 8081 unless there exists a preconfigured port
var serverPort = process.env.PORT || args.port; // Heroku uses PORT


// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(bodyParser.json({
    limit: '50mb'
}));

//API_URL = "http://127.0.0.1:5000"
var API_URL = "https://gp-python.herokuapp.com"

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

/***
// Get
app.get('/process_get', function (req, res) {
   // Prepare output in JSON format
   response = {
      first_name:req.query.first_name,
      last_name:req.query.last_name
   };
   console.log("process_get = ",response);
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
   console.log("process_post = ",response);
   res.end(JSON.stringify(response));
})
***/

// SERP API Post (from search.pug)
app.post('/process_query', urlencodedParser, function (req, res) {
   // Prepare output in JSON format
   response = {
      query:req.body.query,
      //last_name:req.body.last_name
   };
   console.log("process_query =",response);
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
      if (args.verbose > 3) {
         console.log(data)
      }
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
   console.log("get_query = ",response);
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
      if (args.verbose > 3) {
         console.log(data)
      }
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
   console.log("process_git = ",response);
   // let p = {q: response.query, location: null, hl: "en", gl: "us"} // any

   // with request options
   const options = {
     'disableConsole ': true
   };
   
   googleIt(options, {'query': response.query }).then(results => {
   // access to results object here
       let json_string = JSON.stringify(results);
       if (args.verbose > 3) {
         console.log(results)
       }

       data = {
         query: response.query,
	 organic_results: results
       }

       res.render('search-git', {data:data, json:json_string})
      //res.sendFile( __dirname + "/" + "search3.html" ); // search = post

   }).catch(e => {
   // any possible errors that might have occurred (like no Internet connection)
     	console.log(e.message);
	res.send(e.message);
   })
})


// Python Web scraper (googler) Post from (search_googler.pug)
// https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
// https://stackoverflow.com/questions/11826384/calling-a-json-api-with-node-js
//
// POST with Require
// https://www.thepolyglotdeveloper.com/2017/10/consume-remote-api-data-nodejs-application/
//
app.post('/googler_process', urlencodedParser, function (req, res) {
   response = {
      query:req.body.query,
   };
   console.log("googler_process = ",response);

   //request('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', { json: true }, (err, res, body) => {
   //request(API_URL+'/json?q='+response.query, 
   request(args.api+'/json?q='+response.query, 
		   { json: true }, (err, res2, results) => {
      if (err) {
         console.log(err); 
         var fakeData = {
            //error: "Python API not yet available",
            error: err,
            query: response.query,
         };
         res.render('search-googler', {data:fakeData})
         //return console.log(err); 
      } else if (res2.statusCode !== 200) {
         console.log('Status:', res2.statusCode);
         var fakeData = {
            //error: "Python API not yet available",
            error: 'Status = '+res2.statusCode,
            query: response.query,
         };
         res.render('search-googler', {data:fakeData})
      } else {
         //console.log(body.url);
         //console.log(body.explanation);
         let json_string = JSON.stringify(results);

	 if (args.verbose > 3) {
           console.log(results)
         }
         let related = results.related_searches;
         related.forEach((rel, index) => {
           //console.log(rel.query)
	   //console.log(rel.link)
	   var new_link = rel.query.replace(/\s/g, '+');
           //console.log(new_link);
	   rel.link = "/get_pquery/"+new_link;
        })

        //res.render('search-googler', {data:results, json:json_string})
        res.render('search', {data:results, json:json_string, related_searches2:related})
	       
      //res.render('search-googler', {})
      }
   }); // request.get
}) // post


// Python Web scraper (googler) get from (search_googler.pug)
app.get('/get_pquery/:q', function (req, res) {
   response = {
      query:req.params.q,
   };
   console.log("get_pquery = ",response);

   //request('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', { json: true }, (err, res, body) => {
   //request(API_URL+'/json?q='+response.query, { json: true }, (err, res2, results) => {
   request(args.api+'/json?q='+response.query,
		   { json: true }, (err, res2, results) => {
      if (err) {
         var fakeData = {
            //error: "Python API not yet available",
            error: err,
            query: response.query,
         };
         res.render('search-googler', {data:fakeData})
         return console.log(err); 
      }
      //console.log(body.url);
      //console.log(body.explanation);
      let json_string = JSON.stringify(results);
      if (args.verbose > 3) {
         console.log(results)
      }

      let related = results.related_searches;
      related.forEach((rel, index) => {
	 //console.log(rel.query)
	 //console.log(rel.link)
	 var new_link = rel.query.replace(/\s/g, '+');
         //console.log(new_link);
	 rel.link = "/get_pquery/"+new_link;
      })

      //res.render('search-googler', {data:results, json:json_string})
      res.render('search', {data:results, json:json_string, related_searches2:related})
	       
      //res.render('search-googler', {})
   });
}) // get


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
   
   if (host === '::') {
	   host = 'localhost'
   }
   //console.log("Example app listening at http://%s:%s", host, port)

   console.log('Your server is listening on port %d (http://%s:%d)', serverPort, host, serverPort);
})

