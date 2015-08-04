var log = console.log;
var net = require('net'), wss = new (require('ws').Server)({ port: 8087});
wss.on('connection', function connection(ws) {
	log("connection received from proxy");
	var conns = {}, conn_id = 0;
  ws.on('message', function incoming(data) {
  	if(typeof(data) == 'string'){
			conn_id = data;
			if(!conns[conn_id]) {
				conns[conn_id] = new tcpClient(ws, conn_id, function(){
					if(conns)
						delete conns[conn_id];
				});
			}
		}
		else if(conns[conn_id])
			conns[conn_id].send(data);
  });
  var killConns = function(){
    for(var key in conns){
      try {
        conns[key].client.destroy();
      } catch(e){}
      delete conns[key];
    }
    conns = null;
  };
  ws.on('close', killConns);
  ws.on('end', killConns);
  ws.on('disconnect', killConns);
});

var tcpClient = function (ws, conn_id, onClose){
	var buff = [];
	var client = new net.Socket();
	this.client = client;
	client.connect(443, 'turn-euw2-ec2.browserstack.com', function() {
		log('connected to turn', client.remotePort, client.remoteAddress);
		while (buff.length > 0 && client && client.writable){
			tcp_send(client, buff.shift());
		}
		buff = [];
	});
	client.on('data', function(data) {
		ws_send(ws, conn_id);
		ws_send(ws, data);
	});
	client.on('close', function() {
		log('connection to turn closed');
		onClose();
	});
	client.on('error', function (error) {
		log('turn error', error);
  	onClose();
  });
  this.send = function(data){
  	if(client && client.writable)
			tcp_send(client, data);
		else
			buff.push(data);
  }
}

function ws_send(ws, data){
	try{
		if(ws && ws.readyState == 1)
			ws.send(data);
	}
	catch(e){}
}

function tcp_send(client, data){
	try{
		client.write(data);
	}
	catch(e){}
}
