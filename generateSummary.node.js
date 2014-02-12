// generate html summary of smile objects, with gallery number, image, accession number, etc.

var data = require("./dumpTagged.json").docs;
// gallery-id, image, accession number
var $ = require("jquery");

var string = "<html><body><table>\n";

$.each(data, function(index, item){
//	console.log(item);
	if(!item['gallery-id']){return true;}
	var image = item.image;
	var link = item.links.source.href;
	image = image.replace("http://images.metmuseum.org/", "imageCache_480/");
	string += "<tr><TD><a href='"+link+"' target='_blank'><img src='"+image+"' width=128/></a></td>";
	string += "<td><a href='"+link+"' target='_blank'>"+item['accession number']+"</a><BR>"+item.title+"<BR>Gallery: "+item['gallery-id']+"</td></tr></tr>\n";

});

string +="</table></body></html>\n";

console.log(string);