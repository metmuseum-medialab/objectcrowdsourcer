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

var db_name = "objecttags";

var nano = require('nano')('http://localhost:5984');
var db = nano.use(db_name);

var doc = {nano: true};


// create db if it doesn't exist
db.insert(doc,
  function (error,http_body,http_headers) {
    if(error) {
      if(error.message === 'no_db_file') {
        // create database and retry
        return nano.db.create(db_name, function () {
        	console.log("created");
        });
      }
      else { return console.log(error); }
    }
   	delete_all();

    console.log(http_body);
});


// delete all objects currently in db
var num_to_delete = 0;
var num_deleted = 0;
function delete_all(){
	console.log("deleting all");
	db.list(function(err, body) {
	  if (!err) {
	  	num_to_delete = body.rows.length;
	    body.rows.forEach(function(doc) {
	      db.destroy(doc.id, doc.value.rev, function(err, body){
	      	maybe_all_deleted();
	      });
	    });
	  }
	});
}

function maybe_all_deleted(){
	num_deleted++;
	if(num_deleted >= num_to_delete){
		initialize_filters(function(){insert_tests();});
	}
}


function initialize_filters(callback){

	console.log("initializing filters");

	callback();
}


// create some sample objects, put in couchdb
var design = {
	"_id" : "_design/objecttagger",
	"updates": {
  		"in-place" : "function(doc, req) { "+
		    " var body = JSON.parse(req.body); " +
		    "  var field = body.field; "+
		    "  var value = body.value; "+
		    "  var message = toJSON(body) + 'set '+field+' to '+value; "+
		    "  doc[field] = value; "+
		    "  return [doc, message]; "+
  		"	}",

  		"add-tag" : "function(doc, req) { " + 
		    " var body = JSON.parse(req.body); " +
		    " 	return [ null, 'ok'] ; " + 
		" } "
  	},
  	"views" : { 
  		"objects_ready_for_face_tag" : {
  			"map" : "function(doc){ "+
  			" if(doc.assigned == false && doc.tags.faces.length < 2){ " +
  			" 	ready = true; " +
  			" } else{ " + 
  			"	ready = false " +
  			" } " +
  			"	emit(ready, doc); " + 
  			"} " 
  		}

  	}

};


var object1 = {
	id : "1",
	name : "object1",
	assigned : false,
	tags :
	{
		faces : [
			{
				center_pos : { value : [23,43], user : "donundeen@yahoo.com" },
				smile : {value : true, user : "ellen@ellen.com"},
				smile_type : {value : "smirk", user : "ellen@ellen.com"},
			}
		]
	}
};

var object2 = {
	id : "2",
	name : "object2",
	assigned : false,
	tags :
	{
		faces : [
			{
				center_pos : { value : [33,63], user : "donundeen@yahoo.com" },
				smile : {value : false, user : "ellen@ellen.com"},
			},
			{
				center_pos : { value : [33,63], user : "donundeen@yahoo.com" },
				smile : {value : false, user : "ellen@ellen.com"},
			}
		]
	}
};

var object3 = {
	id : "3",
	name : "object3",
	assigned : false,
	tags :
	{
		faces : [
			{
				center_pos : { value : [103,63], user : "donundeen@yahoo.com" },
			}
		]
	}
};

var all_inserted = false;
var num_inserted= 0;
var num_to_insert = 4;
function insert_tests(){

	// put into couchdb:
	db.insert(object1, "object1", function (err, body){
		      	if(!err){
		      		console.log("inserted");
		      		console.log(body);
		      		maybe_all_inserted();
		      	}else{
		      		console.log("error");
		      		console.log(err);
		      	}
	});
	db.insert(object2, "object2", function (err, body){
			      	if(!err){
		      		console.log("inserted");
		      		console.log(body);
		      		maybe_all_inserted();
		      	}else{
		      		console.log("error");
		      		console.log(err);
		      	}
	});
	db.insert(object3, "object3", function (err, body){
			      	if(!err){
		      		console.log("inserted");
		      		console.log(body);
		      		maybe_all_inserted();
		      	}else{
		      		console.log("error");
		      		console.log(err);
		      	}
	});
	db.insert(design, design._id, function (err, body){
			      	if(!err){
		      		console.log("inserted");
		      		console.log(body);
		      		maybe_all_inserted();
		      	}else{
		      		console.log("error");
		      		console.log(err);
		      	}
	});	
}

function maybe_all_inserted(){
	num_inserted++;
	if(num_inserted >=num_to_insert){
		get_objects_needing_tags();
	}
}

// get a smple objects that are tagged with attribute Y less than X times, that aren't currently assigned
// - I think this requires those filter functions.
function get_objects_needing_tags(){
	console.log("getting objects needing tags");

	get_unassigned_object();
	get_unassigned_object();
	get_unassigned_object();
}


function get_unassigned_object(){
	console.log("getting get_unassigned_object");
	db.view("objecttagger", "objects_ready_for_face_tag", {keys: [true], limit: 1 } , 
	function(err, body){
		console.log(body); 
		console.log(err);
		if(body.rows.length == 0){
			return;	
		}
		var name = body.rows[0].value.name;		
		console.log("updating" + name);
		db.atomic("objecttagger", "in-place", name, 
		  { field: "assigned", value: true }, 
		  function(e,b) { 
		  	if(e){
		  		get_unassigned_object();
		  	}else{
			  	console.log("in-place updated" ); 
			  	console.log(b); 
			}
		}); 
	});
}

// update object to say it's currently assigned for tagging (can we do this atomically with getting the objec??)


// update sample objects with tags






// updat

// validate that concurrency isn't a problem





