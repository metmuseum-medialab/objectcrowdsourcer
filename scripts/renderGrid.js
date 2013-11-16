
var $ = require("jquery");

var async = require("async");

var gm = require("gm");

var file = require("fs");

var im = gm.subClass({ imageMagick: true });

var path = require("path");

var cacheBase= path.resolve("../imageCache/") + "/";


var fs = require("../node_modules/node-fs/lib/fs");


var gridstring = "";

var filename = "../dumpTagged.json";

gridstring += "<html><head></head><body><Table border=1>"

var taggedData = require(filename);

var index = 0;

var columns = 8;

var last = false;

async.eachSeries(taggedData.docs, function(item, callback){

	var string = "";

	if(index % columns == 0){
		string += "<tr>";

	}

	index++;



	var image = item.image;


	var imagePath = image.replace("http://images.metmuseum.org/", "");

	imagePath = "imageCache/" +imagePath;

	string += "<td>";


	string += "<img src='"+imagePath+"' width=128 />";

	string += "</td>\n";

	last = false;
	if(index % columns == 0){
		last= true;
		string += "</tr>\n";
	}


	gridstring += string;

	callback();


}, function(err){
	if(err) { 
		console.log("was error"); 
		console.log(err);
	}else{
		console.log("done " );

		if (!last){
			gridstring += "</tr>";
		}

		gridstring += "</table>\n</html>";

		fs.writeFile('../grid.html', gridstring, function(err) {
			if (err) throw err;
		   		console.log('file saved');
			}
		);

	}
});



