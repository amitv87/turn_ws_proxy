var net = require('net'), wss = new (require('ws').Server)({ port: 8087});
wss.on('connection', function connection(ws) {
	console.log("connection received from proxy");
	var conns = {}, conn_id = 0;

  ws.on('message', function incoming(data) {
  	if(typeof(data) == 'string'){
			conn_id = data;
			if(!conns[conn_id]) {
				// console.log('recv ws createClient', data);
				conns[conn_id] = new createClient(ws, conn_id, function(){
					delete conns[conn_id];
				});
			}
		}
		else if(conns[conn_id])
			conns[conn_id].send(data);
  });
});

var createClient = function (ws, id, onClose){
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
		// console.log('recv client ws sent', id, data);
		if(ws && ws.readyState == 1){
			ws.send(id);
			ws.send(data);
		}
	});

	client.on('close', function() {
		console.log('connection to turn closed');
		onClose();
	});
	client.on('error', function (error) {
  	console.log('turn error', error);
  	onClose();
  });
  this.send = function(data){
  	// console.log('recv ws client sent', id, data);
  	if(client && client.writable)
			client.write(data);
		else
			storeBuff(data);
  }
}