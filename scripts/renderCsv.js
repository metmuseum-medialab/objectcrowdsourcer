
var $ = require("jquery");

var async = require("async");

var gm = require("gm");

var file = require("fs");

var json2csv = require('json2csv');


var fs = require("../node_modules/node-fs/lib/fs");



var filename = "../dumpTagged.json";


var im = gm.subClass({ imageMagick: true });

var path = require("path");

var cacheBase= path.resolve("../imageCache/") + "/";

var gridString = "";

gridString += "";

var taggedData = require(filename);

var index = 0;

var columns = 5;

var last = false;

var simpleData = [];

//console.log(taggedData);


async.eachSeries(taggedData.docs, function(item, callback){
	console.log("item");
	console.log(item);

	item.numTags = item.tags.faces.length;

	simpleData.push(item);

	callback();

}, function(err){
	if(err) { 
		console.log("was error"); 
		console.log(err);
	}else{
		console.log("done ");


		json2csv({data: simpleData, 
				fields :  ['id','accession number','title','who', 'image', 'when','date', 'numTags']
				}, 
				function(err, csv) {
					if (err){ 
						console.log(err);
					}else{
						console.log(csv);
						fs.writeFile('../data.csv', csv, function(err) {
							if (err) throw err;
						   		console.log('file saved');
							}
						);
					}
				}
		);
	}
}
);



