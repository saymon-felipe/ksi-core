require('dotenv');
const http = require('http');
const app = require('./app');
const port = process.env.PORT || 3001;
const server = http.createServer(app);

server.setTimeout(300000);
server.keepAliveTimeout = 300000;
server.headersTimeout = 301000;

server.listen(port);