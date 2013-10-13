/* code to call all objects in scrapi, and run the callback function
usage 
var metRunner = require("metRunner");

metRunner = metRunner.getMetRunner({objectCallback: objectCallback, 
									filterCallback : filterCallback,
									finishedCallback : finishedCallback});


metRunner.run();

 objectCallback = function to run for each individual objet page callback
- input : json array of object data from scrapi call
`
 filtercallback = function, returns true or false, to process or skip the object
- input : json array of object data from scrapi call

finishedCallback : method to run when done.




*/


var $ = require("jquery");
var fs = require("./node_modules/node-fs/lib/fs");

var crypto = require('crypto');
if(typeof module !== 'undefined'){
	// if we're running server-side, this stuff needs to happen.
	module.exports.getMetRunner = getMetRunner;
	var $ = require('jquery');
	var jQuery = $;
}else{
	// we're running client-side, and need a different way to include the necessary code.
	console.log("some sort of problem creating module");
}





function getMetRunner(options){

	return new metRunner(options);

}

var metRunner = function(options){
	this.keepGettingPages = true;
	this.numObjects = options.numObjects;
	this.useCache = options.useCache;
	this.startpage = options.startpage;
	this.endpage = options.endpage;
	this.query = options.query;
	this.withImages = options.withImages;
	if(!this.withImages){
		this.withImages = false;
	}
	this.pendingCalls = 0;
	this.fromCache = 0;
	this.notFromCache = 0;
	this.totalUrlsCalled = 0;
	this.totalWrittenToCache = 0;
	this.baseUrl = "http://scrapi.org/";
	this.objectCallback = options.objectCallback;
	this.filterCallback = options.filterCallback;
	this.finishedCallback = options.finishedCallback;
}


metRunner.prototype.run = function(){
	this.runOnAllMetObjects();

}

metRunner.prototype.runOnAllMetObjects = function(){
	//	iterate over all objects called from /ids,
	var page = this.startpage;

	this.getMetObjectsPage(page);


}


metRunner.prototype.getMetObjectsPage = function(pageNumber){
	var url = this.baseUrl + "ids?page=" + pageNumber ;
	if(this.withImages){
		url += "&images=true";
	}
	if(this.query){
		url += "&query="+escape(this.query);
	}
	var realthis = this;
//	console.log("calling objectlist url " + url);
	this.cacheProxy(url, function(idList){realthis.processMetList(idList)});
	var realthis = this;
	pageNumber++;
	if(this.keepGettingPages && pageNumber < this.endpage){
		/*
		if(this.pendingCalls > 3000){
			console.log(this.pendingCalls + " too many pending, waiting");
			setTimeout(function(){realthis.getMetObjectsPage(pageNumber);}, 1000);
		}else{		
			*/
			setTimeout(function(){realthis.getMetObjectsPage(pageNumber);}, 1000);
//		}
	}
}


metRunner.prototype.wait = function(){
	realthis = this;
	if(this.pendingCalls > 30){
		console.log(this.pendingCalls + " too many pending, waiting");
		setTimeout(function(){realthis.wait();},1000);
	}

}


metRunner.prototype.processMetList = function(list){


	//	this.wait();
	var collection = list.collection;
	console.log("idslist ");
	console.log(collection);
	if(collection.items.length == 0){
		console.log("no objects on this page");
		this.keepGettingPages = false;
		return;
	}

	var realthis = this;

	$(collection.items).each(function(key, value){
		var objectUrl =  value.href;
//		console.log("calling object url " + objectUrl);
		realthis.cacheProxy(objectUrl, function(objectJson){realthis.processMetObject(objectJson)});


	});

}


metRunner.prototype.processMetObject = function (objectJson){

	// call the callback
	if(this.filterCallback(objectJson) == false){
		return;
	}

	this.objectCallback(objectJson);

}



metRunner.prototype.getFromCache = function(url){
	// couch or filesystem?

	if(!this.useCache){
		return false;
	}

	var path = this.urlToCacheHash(url);

	if(fs.existsSync(path)){
		this.fromCache++;
		// get data file and return;
		var data = fs.readFileSync(path, {encoding: "utf-8"});
		console.log("got data from cache");
		console.log(data);
		if (data.trim() == ""){return false;}
		data =  JSON.parse(data);
		console.log(data);

		return data;
	}
//	console.log("no data at " + path);
	this.notFromCache++;

	return false;

}

metRunner.prototype.storeToCache = function(url, data){
	// couch or filesystem
	if(!this.useCache){
		return;
	}

	var dir = this.urlToDirPath(url);

	if(!fs.existsSync(dir)){

//		console.log("dir " + dir + " not found");
		fs.mkdirSync(dir, 0777, true);
	}
	var filepath = this.urlToCacheHash(url);

	fs.writeFile(filepath, JSON.stringify(data, null));

	this.totalWrittenToCache++;

}

metRunner.prototype.urlToCacheHash = function(url){

	var hash = crypto.createHash('md5').update(url).digest("hex");
	
	var path = this.urlToDirPath(url)+"/"+hash+".json";
	return path;
}

metRunner.prototype.urlToDirPath = function(url){
	var hash = crypto.createHash('md5').update(url).digest("hex");
//	console.log("hash of " + url + " is " + hash);

	var d1 = hash.substring(0,2);
	var d2 = hash.substring(2,4);
	var d3 = hash.substring(4,6);

	var path = "cache/"+d1+"/"+d2+"/"+d3;	

	return path;


}



metRunner.prototype.urlToKey = function(url){

}

metRunner.prototype.cacheProxy = function (url, callback) {
	// if use the url as key, try to get the object from cache.

	// if not in cache, load from url, then save in cache. 

	// call callback when data retreived.
	console.log("in cacheproxy, pending calls is " + this.pendingCalls);

	var realthis = this;

	// check in cache
	var data = this.getFromCache(url);
	this.totalUrlsCalled++;

	console.log("from cache: " + this.fromCache + "  not: " +this.notFromCache + " total : " + this.totalUrlsCalled);
	if(data){
//		console.log("got from cache");


		callback(data);

		if(realthis.pendingCalls == 0){
			realthis.finishedCallback();
		}		

		return;
	}


	// not bothering with scraping right now...
//	return;

/*
	if(this.pendingCalls > 3000){
//		console.log(this.pendingCalls + " too many pending, waiting");
		setTimeout(function(){realthis.cacheProxy(url, callback);}, 1000);
	}	

*/
	this.pendingCalls++;


	console.log("not in cache, getting data from url " +url);


    $.ajax({
		url : url,
		error : function(retdata){
			console.log("failure");
			console.log(retdata);
			realthis.pendingCalls--;
		},
		success : function (retdata){
			// console.log("|"+retdata+"|");

			realthis.pendingCalls--;

			if(retdata == ''){
				console.log("no results");

		  		return true;
			}
//			console.log("parsing");
//			console.log(retdata);
//			retdata = JSON.parse(retdata);

//			console.log("writing to cache: " + realthis.totalWrittenToCache);
			realthis.storeToCache(url, retdata);


			callback(retdata);

			if(realthis.pendingCalls == 0){
				realthis.finishedCallback();
			}
		}
	});
}