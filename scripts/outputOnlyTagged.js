var db_name = "objecttags";

var nano = require('nano')('http://localhost:5984');
var db = nano.use(db_name);
var $ = require("jquery");


db.view("objecttagger", "tagged_objects", {keys: [true]} , 
  function(err, body){

    if(err){
      console.log("error getting next object");
      console.log(err);
      return;
    }else{
    	if(!body || body.rows.length == 0){
    		console.log(body);

      		return; 
    	}else{

			console.log('{"total_rows":'+body.rows.length+',"offset":0,"docs":[');  		
    		//console.log(body);
    		$(body.rows).each(function(index, item){
    			delete item.value._rev;
    			console.log(JSON.stringify(item.value));
    			console.log(",");
    		});
    		console.log("]}");
    	}
	}
  });