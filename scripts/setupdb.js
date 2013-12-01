var db_name = "objecttags";

var nano = require('nano')('http://localhost:5984');
var db = nano.use(db_name);



// create some sample objects, put in couchdb
var design = {
  "_id" : "_design/objecttagger",
  "updates": {
      "in-place" : "function(doc, req) { "+
        " var body = JSON.parse(req.body); " +
        "  var field = body.field; "+
        "  var value = body.value; "+
        "  var message = toJSON(body) + 'set '+field+' to '+value; "+
        "  doc[field] = value; "+
        "  return [doc, message]; "+
      " }",
      "in-place-faces" : "function(doc, req) { "+
        " var body = JSON.parse(req.body); " +
        "  var faces = body.faces; "+
        "  var message = 'setting faces'; "+
        " if(!doc.tags) { " +
        "   doc.tags = {} " +
        " } " + 
        "  doc.tags.faces = faces; "+
        " doc.assigned_for_tagging = false; " + 
        "  return [doc, message]; "+
      " }",


      "add-tag" : "function(doc, req) { " + 
        " var body = JSON.parse(req.body); " +
        "   return [ null, 'ok'] ; " + 
    " } "
  },
  "views" : { 
    "objects_ready_for_face_tag" : {
      "map" : "function(doc){ "+
//        " if((!doc.assigned_for_tagging) && (!doc.tags || !doc.tags.faces || doc.tags.faces.length < 2)){ " +
      " if((!doc.assigned_for_tagging) && (!doc.tags || !doc.tags.faces || !doc.tags.faces)){ " +
      "   ready = true; " +
      " } else{ " + 
      "   ready = false ;" +
      " } " +
      " emit(ready, doc); " + 
      "} " 
    },
    "assigned_objects" : {
      "map" : "function(doc){ "+
//        " if((!doc.assigned_for_tagging) && (!doc.tags || !doc.tags.faces || doc.tags.faces.length < 2)){ " +
      " if(doc.assigned_for_tagging){ " +
      "   ready = true; " +
      " } else{ " + 
      "   ready = false ;" +
      " } " +
      " emit(ready, doc); " + 
      "} " 
    },
    "objects_by_who" : {
      "map" : "function(doc){ "+
//        " if((!doc.assigned_for_tagging) && (!doc.tags || !doc.tags.faces || doc.tags.faces.length < 2)){ " +
      " var who = ''; " + 
      " if(doc.who){ " +
      "   who = doc.who; " +
      "   emit(who, doc); " + 
      " } " +
      "} " ,
      "reduce" : "_count" 
    },

    "num_objects_by_who" : {
      "map" : "function(doc){ "+
//        " if((!doc.assigned_for_tagging) && (!doc.tags || !doc.tags.faces || doc.tags.faces.length < 2)){ " +
      " var who = ''; " + 
      " if(doc.who){ " +
      "   who = doc.who; " +
      "   emit(who, doc); " + 
      " } " +
      "} ",
      "reduce" : "_count" 
    },    

    "rand_objects_by_who" : {
      "map" : "function(doc){ "+
//        " if((!doc.assigned_for_tagging) && (!doc.tags || !doc.tags.faces || doc.tags.faces.length < 2)){ " +
      " var who = ''; " + 
      " if(doc.who){ " +
      "   who = doc.who; " +
      "   emit([who, Math.random()], doc); " + 
      " } " +
      "} " ,
      "reduce" : "_count" 
 
    },

    "rand_objects" : {
      "map" : "function(doc){ "+
//        " if((!doc.assigned_for_tagging) && (!doc.tags || !doc.tags.faces || doc.tags.faces.length < 2)){ " +
      " var who = ''; " + 
      " if(doc.who){ " +
      "   who = doc.who; " +
      "   emit(Math.random(), doc); " + 
      " } " +
      "} " ,
      "reduce" : "_count" 

    },    

    "tagged_objects" : {

      "map" : "function(doc){ "+
//        " if((!doc.assigned_for_tagging) && (!doc.tags || !doc.tags.faces || doc.tags.faces.length < 2)){ " +
      " if(doc.tags && doc.tags.faces && doc.tags.faces[0] && doc.tags.faces[0].center_pos){ " +
      "   ready = true; " +
      " } else{ " + 
      "   ready = false ;" +
      " } " +
      " emit(ready, doc); " + 
      "} " 

    },

    "images_tagged_per_email" : {
      "map" : " function(doc){  "+
          " if(doc.tags && doc.tags.faces && doc.tags.faces[0] && doc.tags.faces[0].center_pos){  "+
          "  emit(doc.tags.faces[0].center_pos.user, 1); "+
          " }else{ " +
//          "   emit ('bad', 1);" +
          " } " +
          " } " ,
      "reduce" : "_count" 
    },

    "total_tagged_objects" : {
      "map" : " function(doc){  "+
          " if(doc.tags){  "+
          "  emit(doc.tags.faces[0].center_pos.user, 1); "+
          " }else{ " +
//          "   emit ('bad', 1);" +
          " } " +
          " } " ,
      "reduce" : "_count" 
    },



    "total_objects" : {
      "map" : " function(doc){  "+
          "  emit(doc, 1); "+
          " } " ,
      "reduce" : "_count" 
    },


    "faces_tagged_per_email" : {
      "map" : " function(doc){  "+
          " if(doc.tags && doc.tags.faces && doc.tags.faces[0] && doc.tags.faces[0].center_pos){  "+
          "  emit(doc.tags.faces[0].center_pos.user, doc.tags.faces && doc.tags.faces.length); "+
          " }else{ " +
//          "   emit ('bad', 1);" +
          " } " +
          " } " ,
      "reduce" : "_sum" 
    }    
  }

};


db.get("_design/objecttagger", function(err, body){
  if(err){
    console.log("error getting design");
    console.log(err);
    db.insert(design,
      function (error,http_body,http_headers) {
        if(error) {
          if(error.message === 'no_db_file') {
            // create database and retry
            return nano.db.create(db_name, function () {
              console.log("created");
            });
          }
          else { return console.log(error); }
        }
      
        console.log(http_body);
    });    
  }else{
    console.log("got design, going to destroy " + body);
    db.destroy(body._id, body._rev, function(err2, body2){
      if(err){  
        console.log("error destroying design");
        console.log(err);
      }else{
        db.insert(design,
          function (error,http_body,http_headers) {
            if(error) {
              if(error.message === 'no_db_file') {
                // create database and retry
                return nano.db.create(db_name, function () {
                  console.log("created");
                });
              }
              else { return console.log(error); }
            }
          
            console.log(http_body);
        });      
      }
    });
  }
});




