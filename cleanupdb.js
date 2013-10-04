
var db_name = "objecttags";

var nano = require('nano')('http://localhost:5984');
var db = nano.use(db_name);




unsetAllTags();

function unsetAllTags(){
  db.view("objecttagger", "assigned_objects", {} , 
  function(err, body){
  	if(err){
  		console.log("error");
  		console.log(err);
  	}else{
  		console.log(body);
  	    body.rows.forEach(
  	    	function(doc) {

				db.atomic("objecttagger", "in-place", doc.value._id, 
		      	{ field: "assigned_for_tagging", value: false }, 
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
  	    );

  	}
    console.log("maybe untagged objects");
  });
}