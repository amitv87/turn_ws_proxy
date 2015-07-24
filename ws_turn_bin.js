var net = require('net'), wss = new (require('ws').Server)({ port: 8086});
wss.on('connection', function connection(ws) {
	console.log("connection received from proxy");

	var buff = null;
	var storeBuff = function(buffer) {
	  if(buff){
	    var tmp = new Uint8Array(buff.byteLength + buffer.byteLength);
	    tmp.set(new Uint8Array(buff), 0);
	    tmp.set(new Uint8Array(buffer), buff.byteLength);
	    buff = tmp.buffer;
	  }
	  else
	    buff = buffer;
	};

	var client = new net.Socket();
	client.connect(443, 'turn-euw2-ec2.browserstack.com', function() {
		console.log('connected to turn', client.remotePort, client.remoteAddress);
		if(buff && client && client.writable){
			client.write(buff);
			buff = null
		}
	});

	client.on('data', function(data) {
		if(ws && ws.readyState == 1)
			ws.send(data);
	});

	client.on('close', function() {
		console.log('turn connection closed');
		if(ws && ws.readyState == 1)
			ws.close();
	});
	client.on('error', function (error) {
  	console.log('turn error', error);
  });
  ws.on('message', function incoming(data) {
		if(client && client.writable)
			client.write(data);
		else
			storeBuff(data);
  });
  var close_client = function(){
  	if(client)
  		client.destroy();
  }
  ws.on('close', close_client);
  ws.on('end', close_client);
  ws.on('disconnect', close_client);
});
