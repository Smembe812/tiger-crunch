"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
var fs = require('fs');
var https = require('https');
const crypto = __importStar(require("crypto"));
var jwt = require('jsonwebtoken');
exports.options = {
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-crt.pem'),
};
const logger_1 = __importDefault(require("./logger"));
const assert = require('assert');
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const ua_parser_js_1 = __importDefault(require("ua-parser-js"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const uuid_1 = require("uuid");
const user_1 = __importDefault(require("./user"));
const userUseCases = user_1.default.userUseCases;
const app = express_1.default();
const port = 3300;
// const { Issuer } = require('openid-client');
// Issuer.discover('https://accounts.google.com') // => Promise
//   .then(function (googleIssuer) {
//     console.log('Discovered issuer %s %O', googleIssuer.issuer, googleIssuer.metadata);
// });
const { privateKey: AUTH_SIGNER_KEY, publicKey: AUTH_PUB_KEY } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: ''
    }
});
const { privateKey: CLIENT_PRIV_KEY, publicKey: CLIENT_PUB_KEY } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: ''
    }
});
const AUTH_SERVER = 'auth.tiger-crunch.com';
const IssuerMetaData = {
    issuer: AUTH_SERVER,
    authorization_endpoint: `${AUTH_SERVER}/o/oauth2/v2/auth`,
    token_endpoint: `${AUTH_SERVER}/token`,
    jwks_uri: `${AUTH_SERVER}/v1/certs`,
    userinfo_endpoint: `${AUTH_SERVER}/v1/userinfo`,
    revocation_endpoint: `${AUTH_SERVER}/v1/revoke`,
    // introspection_endpoint: <string>,
    // end_session_endpoint: <string>,
    registration_endpoint: `${AUTH_SERVER}/v1/users/`,
};
const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex');
app.use(helmet_1.default());
app.use(cors_1.default({
    origin: ['tiger-crunch.com', 'https://tiger-crunch.com:8000'],
    credentials: true
}));
app.use(body_parser_1.default.json());
app.use(cookie_parser_1.default(AUTH_SIGNER_KEY));
app.use(logConnections);
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { hash } = yield browserHash(req);
    Object.assign(req, { browserHash: hash });
    next();
}));
app.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const access_token = req.signedCookies['access_token'];
    console.log(access_token);
    const host = req.get('host');
    const origin = req.get('origin');
    const fingerprint = req['browserHash'];
    res.send(`Hello from host:${host}, 
        fingerprint:${JSON.stringify(fingerprint)}`);
}));
app.get('/ua-integrity', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(401).json({ isValidUA: isVerifiedUA(req) });
}));
app.post('/auth', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const uaid = req['browserHash'];
    const { claims } = req.body;
    const isAuthentic = yield isAuthenticated({ claims });
    if (isAuthentic) {
        console.time('encrypt');
        const serviceToken = jwt.sign({
            uaid,
            uuid: uuid_1.v4(),
            sub: claims.email,
            iss: 'https://auth.tiger-crunch.com',
            aud: "client-id/domain",
            auth_time: +new Date()
        }, {
            key: AUTH_SIGNER_KEY,
            passphrase: ''
        }, {
            algorithm: 'RS256',
            expiresIn: 60 * 60
        });
        console.timeEnd("encrypt");
        res.set({ 'Cache-Control': 'no-store' });
        res.cookie('access_token', serviceToken, {
            expires: new Date(Date.now() + 8 * 3600000),
            secure: true,
            httpOnly: true,
            signed: true,
            domain: '.tiger-crunch.com'
        });
        return res.json({ access_token: serviceToken });
    }
    return res.json({ message: "wrong pin or email" });
}));
app.post('/users', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userInput = req.body;
        const userResponse = yield userUseCases.createNewUser(userInput);
        res.status(201);
        return res.json(userResponse);
    }
    catch (error) {
        return res.status(422).json({ error: error.message });
    }
}));
app.post('/auth/2fa', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const access_token = req.signedCookies['access_token'];
    const { sub } = jwt.verify(access_token, AUTH_PUB_KEY);
    const proposedPIN = req.body.proposedPIN;
    const data_url = yield userUseCases.setUp2FA({
        email: sub,
        proposedPIN
    });
    return res.send(`<img src="${data_url}">`);
}));
app.post('/auth/2fa/verify', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const access_token = req.signedCookies['access_token'];
    const otp = req.body.otp;
    const { sub } = jwt.verify(access_token, AUTH_PUB_KEY);
    const isUser = yield userUseCases.verify2faSetup({ email: sub }, otp);
    return res.json({
        me: sub,
        success: isUser
    });
}));
function isVerifiedUA(req) {
    const incomingBrowserHash = req.browserHash;
    const access_token = req.signedCookies['access_token'];
    if (!access_token) {
        return (!!access_token);
    }
    const { uaid: browserHash } = jwt.verify(access_token, AUTH_PUB_KEY);
    return (browserHash === incomingBrowserHash);
}
function browserHash(req) {
    const userAgent = req.headers['user-agent'];
    const au = ua_parser_js_1.default(userAgent);
    const acceptHeaders = {
        accept: req.headers["accept"],
        language: req.headers["accept-language"],
    };
    const components = {
        useragent: au,
        acceptHeaders,
    };
    const fingerprint = {
        hash: sha256(JSON.stringify({ components })),
        components
    };
    return Promise.resolve(fingerprint);
}
function logConnections(req, res, next) {
    logger_1.default.info(new Date() + ' ' +
        req.socket.remoteAddress + ' ' +
        // req.socket.getPeerCertificate().subject.CN+' '+ 
        req.method + ' ' + req.url);
    // console.log(new Date()+' '+ 
    // req.socket.remoteAddress+' '+ 
    // // req.socket.getPeerCertificate().subject.CN+' '+ 
    // req.method+' '+req.url); 
    next();
}
const bob = {
    username: "bob",
    password: "mrbombastic"
};
function requestPayment(sender, receiver) {
    const senderPubKey = isAuthenticated(sender);
    const receiverPubKey = receiver;
}
function processPayment(sender, receiver) {
    const authenticSender = jwt.verify(sender.token, AUTH_PUB_KEY);
    const authenticReceiver = receiver.verify();
}
function isAuthenticated(user, agent = null) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield userUseCases.verifyUser(user.claims);
    });
}
function Aunthenticator({ Issuer }) {
    function IDUser(user) {
        const { username, password } = user.claims;
        if (username === bob.username && password === bob.password) {
            let access_token = jwt.sign({ username }, {
                key: AUTH_SIGNER_KEY,
                passphrase: ''
            }, { algorithm: 'RS256' });
            return access_token;
        }
        else {
            throw new Error("Unable to id user");
        }
    }
    function IDClient({ claims }) {
        const { client_secrete: CLIENT_SECRETE, client_id: CLIENT_ID, tansaction, scope } = claims;
        // verify if api key exists
        // const APIKeyData = db.clients.getByID(API_KEY)
        // const issuerDF = APIKeyData.issuerDF 
        const issuer = crypto.createDiffieHellman(Buffer.from(process.env.CLIENT_SECRETE_KEY));
        const issuerKey = issuer.generateKeys();
        const client = crypto.createDiffieHellman(Buffer.from(CLIENT_SECRETE));
        const clientKey = issuer.generateKeys();
        const clientSecret = client.computeSecret(issuerKey);
        const issuerSecret = issuer.computeSecret(clientKey);
        const isValidSecrete = assert.strictEqual(clientSecret.toString('hex'), issuerSecret.toString('hex'));
        if (!isValidSecrete) {
            throw new Error("invalid client secrete");
        }
        return jwt.sign({ scope }, {
            key: AUTH_SIGNER_KEY,
            passphrase: ''
        }, { algorithm: 'RS256' });
    }
}
// console.time('decrypt')
// const buffer = Buffer.from(tokens.sp_token, 'base64')
// const decrypted = crypto.privateDecrypt(
//     {
//       key: CLIENT_PRIV_KEY,
//       passphrase: '',
//     },
//     buffer
// )
// console.timeEnd("decrypt")
// const { Issuer } = require('openid-client');
// (async () => {
//   const issuer = await Issuer.discover('https://accounts.google.com');
//   const Client = issuer.Client;
//   console.log(issuer)
// })()
exports.default = app;
// const crypto = require('crypto');
// const assert = require('assert');
// const fs = require('fs')
// const forge = require('node-forge');
// // Generate Alice's keys...
// const alice = crypto.createDiffieHellman(2048);
// const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
//     namedCurve: 'sect239k1',
//     publicKeyEncoding:  { type: 'spki', format: 'pem' },
//     privateKeyEncoding: { 
//         type: 'pkcs12', 
//         format: 'pem', 
//         passphrase: 'top secret', 
//         cipher: 'aes-256-cbc' 
//     }
//   });
// console.log(privateKey, publicKey)
// crypto.pbkdf2(privateKey, 'salt', 100000, 64, 'sha512', (err, derivedKey) => {
//     if (err) throw err;
//     // console.log(derivedKey)
//     const pki = forge.pki;
//     const cert = pki.createCertificate();
//     cert.publicKey = publicKey;
//     cert.serialNumber = '01';
//     cert.validity.notBefore = new Date();
//     cert.validity.notAfter = new Date();
//     cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
//     const attrs = [{
//         name: 'commonName',
//         value: 'example.org'
//       }, {
//         name: 'countryName',
//         value: 'US'
//       }, {
//         shortName: 'ST',
//         value: 'Virginia'
//       }, {
//         name: 'localityName',
//         value: 'Blacksburg'
//       }, {
//         name: 'organizationName',
//         value: 'Test'
//       }, {
//         shortName: 'OU',
//         value: 'Test'
//       }];
//       cert.setSubject(attrs);
//       // alternatively set subject from a csr
//       //cert.setSubject(csr.subject.attributes);
//       cert.setIssuer(attrs);
//       cert.setExtensions([{
//         name: 'basicConstraints',
//         cA: true
//       }, {
//         name: 'keyUsage',
//         keyCertSign: true,
//         digitalSignature: true,
//         nonRepudiation: true,
//         keyEncipherment: true,
//         dataEncipherment: true
//       }, {
//         name: 'extKeyUsage',
//         serverAuth: true,
//         clientAuth: true,
//         codeSigning: true,
//         emailProtection: true,
//         timeStamping: true
//       }, {
//         name: 'nsCertType',
//         client: true,
//         server: true,
//         email: true,
//         objsign: true,
//         sslCA: true,
//         emailCA: true,
//         objCA: true
//       }, {
//         name: 'subjectAltName',
//         altNames: [{
//           type: 6, // URI
//           value: 'http://example.org/webid#me'
//         }, {
//           type: 7, // IP
//           ip: '127.0.0.1'
//         }]
//       }, {
//         name: 'subjectKeyIdentifier'
//       }]);
//       /* alternatively set extensions from a csr
//       var extensions = csr.getAttribute({name: 'extensionRequest'}).extensions;
//       // optionally add more extensions
//       extensions.push.apply(extensions, [{
//         name: 'basicConstraints',
//         cA: true
//       }, {
//         name: 'keyUsage',
//         keyCertSign: true,
//         digitalSignature: true,
//         nonRepudiation: true,
//         keyEncipherment: true,
//         dataEncipherment: true
//       }]);
//       cert.setExtensions(extensions);
//       */
//       // self-sign certificate
//       cert.sign(privateKey);
//     const pem = pki.certificateToPem(cert);
//     const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
//         privateKey, cert, 'top secret');
//     const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
//     const p12b64 = forge.util.encode64(p12Der);
//     // const p12Der = forge.util.decode64(privateKey);
//     // get p12 as ASN.1 object
//     // const p12Asn1 = forge.asn1.fromDer(p12Der);
//     // decrypt p12 using the password 'password'
//     const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, 'password');
//     console.log(p12)
//     fs.writeFileSync(`${derivedKey.toString('hex')}.pem`, privateKey)
//     const data = fs.readFileSync(`${derivedKey.toString('hex')}.pem`, "utf8")
//     const sign = crypto.createSign('SHA256');
//     sign.write('some data to sign');
//     sign.end();
//     const signature = sign.sign({key:data, passphrase:'top secret'}, 'hex');
//     const verify = crypto.createVerify('SHA256');
//     verify.write('some data to sign');
//     verify.end();
//     console.log(verify.verify(publicKey, signature, 'hex'));
//     console.log(data)
//     // console.log(Buffer.from(publicKey, 'utf8')); // '3745e48...08d59ae'
//     // const decrypted = crypto.privateDecrypt({
//     //     key: data,
//     //     passphrase: 'top secret',
//     // }, Buffer.from(publicKey, 'utf8'));
// });
// const aliceKey = alice.generateKeys();
// // Generate Bob's keys...
// const bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());
// const bobKey = bob.generateKeys();
// // Exchange and generate the secret...
// const aliceSecret = alice.computeSecret(bobKey);
// const bobSecret = bob.computeSecret(aliceKey);
// const ciphers = crypto.getCiphers();
// // console.log(ciphers);
// // const pkey = crypto.createPrivateKey(bobKey)
// // console.log(pkey)
// // console.log(aliceSecret.toString('hex'), bobSecret.toString('hex'))
// // OK
// assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
//# sourceMappingURL=index.js.map