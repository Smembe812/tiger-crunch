const fs = require('fs'); 
const https = require('https');
const {URL} = require('url')
const express = require('express')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware');
const cors = require('cors')
const config = require('./webpack.dev.js');
const app = express();
const compiler = webpack(config);
const host = 'auth.tiger-crunch.com'
const options = { 
    hostname: host, 
    port: 3000, 
    path: '/', 
    method: 'GET', 
    key: fs.readFileSync('../../auth-client-key.pem'), 
    cert: fs.readFileSync('../../auth-client-crt.pem'), 
    ca: fs.readFileSync('../../ca-crt.pem')
};
function requestListener (req, res, next) {
    // fs.promises.readFile(__dirname + "/log-in.html")
    // .then(contents => {
        if(req.headers['referer']){
            const clientOrigin = new URL(req.headers['referer']).origin
            res.setHeader("Content-Security-Policy", `frame-ancestors 'self' ${clientOrigin}; frame-src ${clientOrigin}`)
            res.setHeader("Access-Control-Allow-Origin", clientOrigin)
            res.setHeader("Cross-Origin-Resource-Policy", 'cross-origin')
        }
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Access-Control-Allow-Origin", "https://tiger-crunch.com:4433")
        // res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
        // res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
        // res.writeHead(200);
    //     res.end(contents);
    // })
    // .catch(err => {
    //     res.writeHead(500);
    //     res.end(err);
    //     return;
    // });
    next()
};
app.use(
    webpackDevMiddleware(compiler, {
        publicPath: config.output.publicPath,
    })
)
app.use(requestListener)
const server = https.createServer(options, app);
server.listen(options.port, () => {
    console.log(`Server is running on https://${host}:${options.port}`);
});