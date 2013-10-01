// node.js
// server for crowdsourcing tagger app

// maintain connection to couchdb server

/* 
accept requests from client to:
- pull new, untagged items from SCRAPI
-- do this in a separate, ongoing thread, I think...
- get a new item for a particular tagging task
- tag an item (add a value for a metadata field, for an item)


- keep the data valid in couchdb
- make sure that an object is only tagged for a particular task x number of times, before moving to a new Queue

if we're querying couchdb for everything (use couchdb filters)
- query : get object that's been tagged less than X times for attribute Y, that isn't also in the queue for someone else to tag.
- query : update object to say that it's in the queue for a particular tagging job.
- query : update object with new tagging attribute value
- query : add object from scrapi to the db.


each tag:
- attribute name
- value (might be complex value)
- user who did it.



////
updatey thing:
"updates": {
  "in-place" : "function(doc, req) {
      var field = req.query.field;
      var value = req.query.value;
      var message = 'set '+field+' to '+value;
      doc[field] = value;
      return [doc, message];
  }"
}

@db.updateWithHandler("my_design_doc", "in-place", "<doc_name>", 
  { field: "foo", value: "bar" }, function(e,b) { console.log(b); }); 






*/

/*
testing:
*/

// connect to db,

var urlparser = require("url");
var fs = require("fs");
var pathparser = require("path");

var db_name = "objecttags";

var nano = require('nano')('http://localhost:5984');
var db = nano.use(db_name);



// create some sample objects, put in couchdb





var http = require('http');
http.createServer(function (req, res) {
  parseRequest(req, res);

}).listen(1337, '127.0.0.1');


console.log('Server running at http://127.0.0.1:1337/');


function parseRequest(req, res){
  var parsed = urlparser.parse(req.url, true)
  var query = urlparser.parse(req.url, true).query;
  console.log('~~~~~~~~~~~~~~~~~');
  console.log(parsed);
  console.log('~~~~~~~~~~~~~~~~~');
  console.log(query);
  console.log('~~~~~~~~~~~~~~~~~');

  if(!query.action){
    sendFile(parsed.pathname, query, res);
  }else if (query.action == "nextObject"){
    nextObject(query, res);

  }else{
   res.writeHead(200, {'Content-Type': 'text/html'});
   res.end("<html><body><pre>not sure what to do</pre></body></html>");
  }




}

var dataCache = {};
function sendFile(path, query, res){

  if(path == "/"){
    path = "/index.html";
  }
  var extname = pathparser.extname(path);
  var contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
  }

  if(!dataCache[path]){
    fs.readFile("."+path, function(err, data){
      if(err){
        console.log("file read error");
        console.log(err);
        res.writeHead(404, {'Content-Type': +contentType});
        //indexhtml = data;
        res.end(data);
      }else{
        res.writeHead(200, {'Content-Type': +contentType});
        console.log("writing file " + path);
        console.log(data);
        //dataCache[path] = data;
        res.end(data);
      }
    });
  }else{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(dataCache[path]);
  }
}



function nextObject(query, res){
  console.log("getting next object");
  get_unassigned_object(res);

}




function get_unassigned_object(res){
  var contentType = "application/json";
  res.writeHead(200, {'Content-Type': contentType});

  db.view("objecttagger", "objects_ready_for_face_tag", {keys: [true], limit: 1 } , 
  function(err, body){
    if(body.rows.length == 0){
      res.end("{}");
      return; 
    }
    var object = body.rows[0].value;
    var name = body.rows[0].value._id;   
    db.atomic("objecttagger", "in-place", name, 
      { field: "assigned_for_tagging", value: true }, 
      function(e,b) { 
        if(e){
          get_unassigned_object(res);
        }else{
          res.end(JSON.stringify(object));
        }
      }
    ); 
  });
}

