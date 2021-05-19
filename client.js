const fs = require('fs'); 
const https = require('https'); 
const host = 'tiger-crunch.com'
const options = { 
    hostname: host, 
    port: 4433, 
    path: '/', 
    method: 'GET', 
    key: fs.readFileSync('client1-key.pem'), 
    cert: fs.readFileSync('client1-crt.pem'), 
    ca: fs.readFileSync('ca-crt.pem') 
}; 

const req = https.request(options, function(res) { 
    res.on('data', function(data) { 
        process.stdout.write(data); 
    }); 
});
req.end();
req.on('error', function(e) { 
    console.error(e); 
});
const server = https.createServer(options)
server.listen(options.port, ()=>console.log("server up"))