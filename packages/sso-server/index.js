const fs = require('fs'); 
const https = require('https'); 
const host = 'auth.tiger-crunch.com'
const options = { 
    hostname: 'auth.tiger-crunch.com', 
    port: 3000, 
    path: '/', 
    method: 'GET', 
    key: fs.readFileSync('../../client1-key.pem'), 
    cert: fs.readFileSync('../../client1-crt.pem'), 
    ca: fs.readFileSync('../../ca-crt.pem') 
}; 
function requestListener (req, res) {
    fs.promises.readFile(__dirname + "/log-in.html")
    .then(contents => {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end(contents);
    })
    .catch(err => {
        res.writeHead(500);
        res.end(err);
        return;
    });
};
const server = https.createServer(options, requestListener);
server.listen(options.port, () => {
    console.log(`Server is running on https://${host}:${options.port}`);
});