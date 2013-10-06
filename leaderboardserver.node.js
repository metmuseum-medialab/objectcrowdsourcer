// changes feed listener for leaderboard 



var db_name = "objecttags";

var nano = require('nano')('http://localhost:5984');
var db = nano.use(db_name);


// include_docs = true to get teh whole doc, 
// which in simple cases can tell us who just did a tag.

// might be better just to poll for updates on tag counts per email.
var feed = db.follow({since: "now", include_docs : true});
feed.on('change', function (change) {
  console.log("change: ");
  getObjectsPerEmail();
  getFacesPerEmail();

//  console.log(change);
});
feed.follow();


getObjectsPerEmail();
getFacesPerEmail();



function getObjectsPerEmail(){
  db.view("objecttagger",  "images_tagged_per_email" , {group: true}  , 
  	function(err, body){
    	if(err){
    		console.log("error");
    		console.log(err);
    	}else{
    		console.log("Objects Per Email");
    		console.log(body);
    	}

    }
  );
}

function getFacesPerEmail(){
  db.view("objecttagger",  "faces_tagged_per_email" , {group: true}  , 
  	function(err, body){
    	if(err){
    		console.log("error");
    		console.log(err);
    	}else{
    		console.log("Faces Per Email");
    		console.log(body);
    	}

    }
  );
}


console.log("done?");