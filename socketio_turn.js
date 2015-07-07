var net = require('net')
var io = require('socket.io').listen(8083, { log: false, "destroy buffer size": Infinity });

io.sockets.on('connection', function (socket) {
	console.log("connection open from extension");
	var socks = {};
	
	socket.on('b', function(data){
		if(!socks[data.id])
			socks[data.id] = newTurnClient(data.id);
		try{
			socks[data.id].write(data.buf);
		}
		catch(e){console.log(e)}
	})

	socket.on('c', function(data){
		if(!socks[data.id])
			return
		try{
			socks[data.id].destroy();
		}
		catch(e){console.log(e)}
		delete socks[data.id];
	})

  var newTurnClient = function(id){
  	var client = new net.Socket();
		client.connect(443, 'turn-euw2-ec2.browserstack.com', function() {
			console.log('connected to turn', client.remotePort, client.remoteAddress);
		});

		client.on('data', function(data) {
			socket.emit('b', {id: id, buf: data});
		});
		
	  return client;
  }
});
