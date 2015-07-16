var net = require('net'), wss = new (require('ws').Server)({ port: 8083});
wss.on('connection', function connection(ws) {
	console.log("connection received from proxy");
	var client = new net.Socket();
	client.connect(443, 'turn-euw2-ec2.browserstack.com', function() {
		console.log('connected to turn', client.remotePort, client.remoteAddress);
	});
	client.on('data', function(data) {
		if(ws.readyState == 1) {
			ws.send(data);
		}
	});
	client.on('close', function() {
		if(ws.upgradeReq.url.match('debug'))
			return;

		console.log('turn connection closed');
		if(ws.readyState == 1)
			ws.close();
	});
	client.on('error', function (error) {
  	console.log('turn error', error);
  });
  ws.on('message', function incoming(data) {
		if(ws.upgradeReq.url.match('debug')){
			console.log('debug', data);
			if(ws.readyState == 1)
				ws.send(data);
		}
    client.write(data);
  });
  var close_client = function(){
  	if(client)
  		client.destroy();
  }
  ws.on('close', close_client);
  ws.on('end', close_client);
  ws.on('disconnect', close_client);
});
