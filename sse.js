var http = require('http');
var net = require('net');
var url = require('url');
var querystring = require('querystring');

var sess = {};
http.createServer(function (req, res) {
  var session_id = querystring.parse(url.parse(req.url)["query"])["sid"];

  if(req.url.match("events")){
    res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
    
    var killSocks = function(){
      if(sess[session_id] && sess[session_id].socks){
        var socks = sess[session_id].socks;
        for(var key in socks){
          try {
            socks[key].destroy();
          } catch(e){}
        }
      }
      delete sess[session_id];
      console.log('killed socks', session_id);
    }

    console.log('started', session_id);
    if(sess[session_id])
      killSocks();

    sess[session_id] = {};
    sess[session_id].sse = res;
    sess[session_id].socks = {};

    console.log("New server sent event request");
    req.on('error', killSocks);
    req.on('close', killSocks);
  }
  else {
    try {
      var sockID = req.headers.id;
      if(typeof(sess[session_id].socks[sockID]) === 'undefined'){
        var client =  new net.Socket();
        sess[session_id].socks[sockID] = client;
        client.connect(443, 'turn-euw2-ec2.browserstack.com', function() {
          console.log("Connecting to turn", sockID);
          client.on('data', function(data) {
            // console.log('sockID', sockID);
            sess[session_id].sse.write('id: ' + sockID + '\n');
            sess[session_id].sse.write("data: " + data.toString('base64') + '\n\n');
          });
        });
      }
    }
    catch(ex){
      console.log("invalid query", ex); 
    }
    req.on('data', function (data) {
      if(sess[session_id].socks[sockID])
        sess[session_id].socks[sockID].write(data); 
    });
    req.on('end', function () {
      res.writeHead(200, {});
      res.end();
    });
  }
}).listen(8084);