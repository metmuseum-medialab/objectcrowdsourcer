// cacheAllObjects
http = require("http");
http.globalAgent.maxSockets = 30; 
var $ = require("jquery");
console.log("trying to connect");
//var db = new CouchDB("http://localhost:8088/localhost:5984","example", {"X-Couch-Full-Commit":"false"});


metRunner = require("./metRunner");

var db_name = "objecttags";
var nano = require('nano')('http://localhost:5984');
var db = nano.use(db_name);



var objectCallback = function(objectJson){
	console.log("in objectCallback");
	
	// objectnumber

	var objectid = objectJson['id'];

  objectJson._id = ""+objectid;

  objectJson.links = objectJson._links;
  delete objectJson._links;

  console.log(objectJson);


  db.insert(objectJson, function(err, body, headers){
    if(err){
      console.log("insert error " + err);
    }else{
        console.log("inserted");
    }
  });



}



var filterCallback = function(objectJson){
	console.log("in filterCallback");
	console.log(objectJson);
	return true;

}

var finishedCallback = function(){
	console.log("in finishedCallback");

}

var terms = [
"silly",
	"joy",
	"bust",
	"face",
	"festive",
	"portrait",
	"merry",
	"smiling",
	"smiles",
	"happy",
	"laugh",
	"face",
	"head"

];

function callForTerm(termIndex){
	var term = terms[termIndex];
	termIndex++;
	var more = true;
	if(termIndex >= terms.length){
		more = false;
	}

	var options = {
					numObjects : 10,	
					startpage : 1,
					endpage : 6500,
                    useCache : false,
	                withImages : true,
	                query : term,
					objectCallback: objectCallback, 
					filterCallback : filterCallback,
					finishedCallback : finishedCallback
				};
	if(more){
		options.finishedCallback = function(){callForTerm(termIndex);}
	}else{
		options.finishedCallback = finishedCallback;
	}
	var metRunner1 = metRunner.getMetRunner(options);
	metRunner1.run();

}

callForTerm(0);








