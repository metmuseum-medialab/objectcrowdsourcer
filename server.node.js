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



*/

/*
testing:
*/
// delete all objects currently in db

// connect to db,
db = new CouchDB("http://localhost:5984","crowdtagger", {"X-Couch-Full-Commit":"false"});


// if it doesn't exist, create it
try{
    db.info();
}catch(e){
    if(e.error == "not_found" && e.reason == "no_db_file"){
        console.log("creating db");
        db.createDb();
    }else{
        console.log("error");
        console.log(e);
    }
}
// then delete, and create again
db.deleteDb();
db.createDb();

console.log(db.info());


// create some sample objects, put in couchdb
var object1 = {
	id : "1",
	name : "object1",
	assisgned : false,
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
	assisgned : false,
	tags :
	{
		faces : [
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
	assisgned : false,
	tags :
	{
		faces : [
			{
				center_pos : { value : [103,63], user : "donundeen@yahoo.com" },
			}
		]
	}
};


// put into couchdb:



// get a smple objects that are tagged with attribute Y less than X times, that aren't currently assigned
// - I think this requires those filter functions.


// update object to say it's currently assigned for tagging (can we do this atomically with getting the objec??)


// update sample objects with tags






// updat

// validate that concurrency isn't a problem





