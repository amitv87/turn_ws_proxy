var http = require('http');
var net = require('net');
var url = require('url');
var querystring = require('querystring');
var socks = {};

http.createServer(function (request, res) {
  if(request.url.match("events")){
    res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
    console.log("New server sent event request");
    try {
      var sockID = querystring.parse(url.parse(request.url)["query"])["id"];
      request.on('error', function() {
        if(socks[sockID]) {
          socks[sockID].destroy();
          delete(socks[sockID]);
        }
      });
      request.on('close', function() {
        if(socks[sockID]) {
          socks[sockID].destroy();
          delete(socks[sockID]);
        }
      });
      if(typeof(socks[sockID]) === 'undefined'){
        var client =  new net.Socket();
        client.connect(443, 'turn-euw2-ec2.browserstack.com', function() {
          console.log("Connecting to turn");
          socks[sockID] = client;
          client.on('data', function(data) {
            // console.log('client received data', data.toString());
            // res.write(data.toString() + '\n');
            res.write('id: ' + sockID + '\n');
            res.write("data: " + data.toString('base64') + '\n\n');
          });
        });
      }
    }
    catch(ex){
      console.log("invalid query", ex); 
    }
  }
  else {
    // console.log("new xhr request");
    var body = '';
    request.on('data', function (data) {
      if(socks[request.headers.id]){
        // console.log('sending data body', data);
        socks[request.headers.id].write(data); 
      }
    });
    request.on('end', function () {
      res.writeHead(200, {
        // 'Access-Control-Allow-Origin': '*',
        // 'Access-Control-Allow-Headers': 'id, Content-Type',
//        'Access-Control-Request-Method': 'POST,GET',
      });
      res.end();
      
    });
  }
}).listen(8081);