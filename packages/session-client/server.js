const fs = require('fs'); 
const https = require('https');
const express = require('express')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware');
const app = express();
const cors = require('cors')
const config = require('./webpack.dev.js');
const compiler = webpack(config);
app.use((req,res,next) => {
    res.set({"Cross-Origin-Resource-Policy": "same-origin"})
    next()
})
app.use(
    webpackDevMiddleware(compiler, {
        publicPath: config.output.publicPath,
    })
);
app.use(cors({
    origin: ['tiger-crunch.com', 'https://auth.tiger-crunch.com:3000']
}))
const host = 'client.tiger-crunch.com'
const options = { 
    hostname: host, 
    port: 3300, 
    path: '/', 
    method: 'GET', 
    key: fs.readFileSync('../../client2-key.pem'), 
    cert: fs.readFileSync('../../client2-crt.pem'), 
    ca: fs.readFileSync('../../ca-crt.pem') 
}; 
// function requestListener (req, res) {
//     fs.promises.readFile(__dirname + "/test.html")
//     .then(contents => {
//         res.setHeader("Content-Type", "text/html");
//         res.writeHead(200);
//         res.end(contents);
//     })
//     .catch(err => {
//         res.writeHead(500);
//         res.end(err);
//         return;
//     });
// };
const server = https.createServer(options, app);
server.listen(options.port, () => {
    console.log(`Server is running on https://${host}:${options.port}`);
});