
var $ = require("jquery");

var async = require("async");

var gm = require("gm");

var file = require("fs");

var im = gm.subClass({ imageMagick: true });

var path = require("path");

var cacheBase= path.resolve("../imageCache/") + "/";

var gridString = "";

gridString += "<html><head></head><body><Table>"

var taggedData = require(filename);

var index = 0;

var columns = 5;

var last = false;

async.eachSeries(taggedData.docs, function(item, callback){

	var string = "";

	if(index % columns == 0){
		string += "<tr>";

	}

	index++;



	var image = item.imageCache;

	string += "<td>";


	string += image;

	string += "</td>\n";


	if(index % columns == 0){

		string += "</tr>\n";
	}


	gridstring += string;

	callback();


}, function(err){
	if(err) { 
		console.log("was error"); 
		console.log(err);
	}else{
		console.log("done " + numLoops);


		gridstring += "</table>\n</html>";

	}
});



