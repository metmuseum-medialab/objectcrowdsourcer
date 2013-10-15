
var db_name = "objecttags";

var nano = require('nano')('http://localhost:5984');
var db = nano.use(db_name);


get_unassigned_object();

function get_unassigned_object(){


  db.view("objecttagger", "objects_ready_for_face_tag", {keys: [true], limit: 1 } , 
  function(err, body){
  	if(err){
  		console.log("error");
  		console.log(err);
  		return;

  	}
    if(body.rows.length == 0){
    	console.log("no rows");
    	console.log(err);

      return; 
    }
    var object = body.rows[0].value;
    var name = body.rows[0].value._id;   
    db.atomic("objecttagger", "in-place", name, 
      { field: "assigned_for_tagging", value: true }, 
      function(e,b) { 
        if(e){
        	console.log("getting another");
          get_unassigned_object();
        }else{
        	 console.log(b);
        	 console.log(object);
      }
    }); 
  });
}