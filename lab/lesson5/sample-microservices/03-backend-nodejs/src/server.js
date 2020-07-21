// use the express framework
var express = require('express');
var app = express();

console.log('The NodeName is:', process.env.NODE_NAME);
console.log('The PodName is:', process.env.POD_NAME);
console.log('The PodNamespace is:', process.env.POD_NAMESPACE);
console.log('The PodIPaddress is:', process.env.POD_IP);

var ipaddress = process.env.POD_IP;
var podname = process.env.POD_NAME;
var nodename = process.env.NODE_NAME;

// morgan: generate apache style logs to the console
var morgan = require('morgan')
app.use(morgan('combined'));

// express-healthcheck: respond on /health route for LB checks
app.use('/health', require('express-healthcheck')());

// main route
app.get('/', function (req, res) {
  res.set({
  'Content-Type': 'text/plain'
})
  res.send(`Node.js backend is in pod [${podname}] of IP ${ipaddress} running on node [${nodename}]`);
});

app.get('/nodejs/api', function (req, res) {
  res.send({
    from: 'Node.js backend',
    podname: podname,
    nodename: nodename,
    ip: ipaddress
  });
});

// health route - variable subst is more pythonic just as an example
var server = app.listen(3000, function() {
  var port = server.address().port;
  console.log('Node.js backend app listening on port %s!', port);
});

// export the server to make tests work
module.exports = server;
