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
var $ = require("jquery");

var port = 1337;
if(process && process.env && process.env.NODE_ENV == "production"){
  port = 80;
}
// create some sample objects, put in couchdb





var http = require('http');
http.createServer(function (req, res) {
  parseRequest(req, res);

}).listen(port);


console.log('Server running at port ' + port);


function parseRequest(req, res){
  var parsed = urlparser.parse(req.url, true)
  var query = urlparser.parse(req.url, true).query;
  console.log('~~~~~~~~~~~~~~~~~');
 // console.log(parsed);
  console.log('~~~~~~~~~~~~~~~~~');
  //console.log(query);
  console.log('~~~~~~~~~~~~~~~~~');

  if(!query.action){
    sendFile(parsed.pathname, query, res);
  }else if (query.action == "nextObject"){
    nextObject(query, res);

  }else if (query.action == "updateObjectFaces"){
    updateObjectFaces(query, req, res);
  }else if (query.action == "getSummary"){
    getSummary(query, req, res);
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
     //   console.log(data);
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

    if(err){
      console.log("error getting next object");
      console.log(err);
      res.end("{}");
      return;
    }

    if(!body || body.rows.length == 0){
      res.end("{}");
      return; 
    }
    var object = body.rows[0].value;
    var name = body.rows[0].value._id;   
    db.atomic("objecttagger", "in-place", name, 
      { field: "assigned_for_tagging", value: true }, 
      function(e,b) { 
        if(e){
          console.log("*********************have to get another object!!!!!")
          get_unassigned_object(res);
        }else{
          res.end(JSON.stringify(object));
        }
      }
    ); 
  });
}

function updateObjectFaces(query, request, response){
  console.log("in updateObjectFaces");
  console.log(query);
  var faces = JSON.parse(query.faces);
  console.log(faces);
  faces.forEach(function(face){
    console.log("face");
    console.log(face);
  });
  db.atomic("objecttagger", "in-place-faces", query.objectId, 
    {faces : faces },
    function(e,b) { 
      if(e){
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~error");
        console.log(e);
      }else{
        console.log("ok");
      }
    }

    );

}



function getSummary(query, request, response){





  var allData = {};
  var contentType = "application/json";
  response.writeHead(200, {'Content-Type': contentType});


  getTotalObjects(allData, response, maybeWriteSummary);
  getTotalTaggedObjects(allData, response, maybeWriteSummary);
  getObjectsPerEmail(allData, response, maybeWriteSummary);
  getFacesPerEmail(allData, response, maybeWriteSummary);

}

function getTotalTaggedObjects(allData, response, callback){
  db.view("objecttagger", "total_tagged_objects" , 
  function(err, body){
    if(err){
      console.log("error getting summary");
      console.log(err);
      response.end(JSON.stringify({error: err}));
      return;
    }

    var msg = "";
    if(err){
      console.log("error" + err);
    }else{
      console.log("getting total tagged objects");
      allData.total_tagged_objects = body;
      msg += "body: " + body;
    }
    callback(allData, response);
  }); 
}


function getTotalObjects(allData, response, callback){
  db.view("objecttagger", "total_objects" , 
  function(err, body){
    if(err){
      console.log("error getting summary");
      console.log(err);
      response.end(JSON.stringify({error: err}));
      return;
    }

    var msg = "";
    if(err){
      console.log("error" + err);
    }else{
      console.log("getting total objects");
      allData.total_objects = body;
      msg += "body: " + body;
    }
    callback(allData, response);
  }); 
}

function getObjectsPerEmail(allData, response, callback){
  db.view("objecttagger",  "images_tagged_per_email" , {group: true}  , 
  function(err, body){
    if(err){
      console.log("error getting summary");
      console.log(err);
      response.end(JSON.stringify({error: err}));
      return;
    }

    var msg = "";
    if(err){
      console.log("error" + err);
    }else{
      console.log("getting num objects per_email");
      allData.objects_per_email = body;
      msg += "body: " + body;
    }
    callback(allData, response);
  }); 
}

function getFacesPerEmail(allData, response, callback){
  db.view("objecttagger",  "faces_tagged_per_email" , {group: true}  , 
  function(err, body){
    if(err){
      console.log("error getting summary");
      console.log(err);
      response.end(JSON.stringify({error: err}));
      return;
    }

    var msg = "";
    if(err){
      console.log("error" + err);
    }else{
      console.log("getting num faces per_email");
      allData.faces_per_email = body;
      msg += "body: " + body;
    }
    callback(allData, response);
  }); 
}

function maybeWriteSummary(allData, response){
  if(allData.total_objects && allData.total_tagged_objects && allData.faces_per_email && allData.objects_per_email){
    // summarize in new way:
    var summary = {};
    summary.total_objects = allData.total_objects;
    summary.total_tagged_objects = allData.total_tagged_objects;
    var email_data = {};
    $(allData.faces_per_email.rows).each(function(index, item){
      var email = item.key;
      if(email.trim() == ""){email = 'anonymous';}
      var num = item.value;
      email_data[email] = {faces :  num};
    });
    $(allData.faces_per_email.rows).each(function(index, item){
      var email = item.key;
      if(email.trim() == ""){email = 'anonymous';}
      var num = item.value;
      if(!email_data[email]){
        email_data[email] = {};
      }
      email_data[email].objects =  num;
    });

    var email_array = [];
    $.each(email_data, function(email, value){
      var newObj = {email : email, 
                    faces : value.faces,
                    objects: value.objects};
      email_array.push(newObj);
    });

    summary.email_data = email_array;

    console.log("gonna end");
    response.end(JSON.stringify(summary));
  }else{
    console.log("still waiting");
  }
}
