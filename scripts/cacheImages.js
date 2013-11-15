// cache images, in smaller format, to filesystem

var $ = require("jquery");

var async = require("async");

var gm = require("gm");

var file = require("fs");

var im = gm.subClass({ imageMagick: true });

var path = require("path");

var cacheBase= path.resolve("../imageCache/") + "/";

var filename = "../dumpTagged.json";

var minimalFile = "../taggedMin.json";

var fs = require("../node_modules/node-fs/lib/fs");

var minData = [];

//	fs.writeFile(filepath, JSON.stringify(data, null));
//JSON.parse

var taggedData = require(filename);

var numItems = taggedData.docs.length;
var numWritten = 0;
var numLoops = 0;
var numInQueue = 0;

async.eachLimit(taggedData.docs, 50, function(item, callback){
	numLoops++;
	numInQueue++;
	console.log("################################# " + numInQueue);
	console.log(numInQueue);
//	console.log(index);
	console.log(item.image);
	var imageUrl = item.image;
	var imagePath = imageUrl.replace("http://images.metmuseum.org/", "");

	var dir = cacheBase + path.dirname(imagePath);
	var filename = path.basename(imagePath);
	var imageCachePath = cacheBase + imagePath;

	console.log(imagePath);
	console.log(dir);
	console.log(filename);
	console.log(imageCachePath);


	var minItem = {};

	//return false;

	minItem["image"] = item.image;
	minItem["imageCache"] = imagePath;
	minItem["id"] = item.id;
	minItem["title"] = item.title;
	minItem["tags"] = item.tags;
	minItem["accession number"] = item["accession number"];

	minData.push(minItem);


	if(!fs.existsSync(dir)){

//		console.log("dir " + dir + " not found");
		fs.mkdirSync(dir, 0777, true);
	}


	console.log("testing for " + imageCachePath);

	if(!fs.existsSync(imageCachePath)){
		console.log("writing " + imageUrl +  " to " + imageCachePath);
		console.log(minItem);
		numInQueue++;

		im(encodeURI(imageUrl))
		.resize(1024)
		.autoOrient()
		.write(imageCachePath, function (err) {
			if(err){
				console.log(item);
				console.log("error writing " + imageUrl + " to " + imageCachePath);
				console.log(err);
				numInQueue--;
				callback(err);
			}else{
				console.log('+++++++++++++++++++ hooray! ');

				numInQueue--
				numWritten++;
				//console.log(numWritten++);

				callback();//				console.log(index);
			}
		});
	}else{
		console.log(" ~~~~~~~~~~~~~~~~~~~~~~~~ file  " + imageCachePath + " exists, skipping");
		numInQueue--;
		callback();
	}
//	return false;

}, function(err){
	if(err) { 
		console.log("was error"); 
		console.log(err);
	}else{
		console.log("done " + numLoops);

		console.log(minData);

		fs.writeFile(minimalFile, JSON.stringify(minData, null, "  "));

	}
});

