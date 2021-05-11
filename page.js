const fs = require('fs');
const https = require("https");
const host = 'tiger-crunch.com';
const port = 8000

function requestListener (req, res) {
    fs.promises.readFile(__dirname + "/page.html")
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
var options = { 
    key: fs.readFileSync('server-key.pem'), 
    cert: fs.readFileSync('server-crt.pem'), 
}

const server = https.createServer(options, requestListener);
server.listen(port, () => {
    console.log(`Server is running on https://${host}:${port}`);
});