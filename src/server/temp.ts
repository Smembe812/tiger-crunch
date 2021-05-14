var fs = require('fs');
export const options = { 
    key: fs.readFileSync('server-key.pem'), 
    cert: fs.readFileSync('server-crt.pem'), 
    // ca: fs.readFileSync('ca-crt.pem'),
    // crl: fs.readFileSync('ca-crl.pem'),  
    // requestCert: true, 
    // rejectUnauthorized: true
};
var jwt = require('jsonwebtoken');
import * as crypto from 'crypto';
const assert = require('assert');
const AUTH_SERVER = 'auth.tiger-crunch.com'
const IssuerMetaData = {
    issuer: AUTH_SERVER,
    authorization_endpoint: `${AUTH_SERVER}/o/oauth2/v2/auth`,
    token_endpoint: `${AUTH_SERVER}/token`,
    jwks_uri: `${AUTH_SERVER}/v1/certs`,
    userinfo_endpoint: `${AUTH_SERVER}/v1/userinfo`,
    revocation_endpoint: `${AUTH_SERVER}/v1/revoke`,
    // introspection_endpoint: <string>,
    // end_session_endpoint: <string>,
    registration_endpoint:`${AUTH_SERVER}/v1/users/`,
    // token_endpoint_auth_methods_supported: <string>,
    // token_endpoint_auth_signing_alg_values_supported: <string>
    // introspection_endpoint_auth_methods_supported: <string>
    // introspection_endpoint_auth_signing_alg_values_supported: <string>
    // revocation_endpoint_auth_methods_supported: <string>
    // revocation_endpoint_auth_signing_alg_values_supported: <string>
    // request_object_signing_alg_values_supported: <string>
    // mtls_endpoint_aliases: <Object>
    // token_endpoint: <string>
    // userinfo_endpoint: <string>
    // revocation_endpoint: <string>
    // introspection_endpoint: <string>
}
function logConnections(req, res, next){
    // logger.info(new Date()+' '+ 
    // req.socket.remoteAddress+' '+ 
    // // req.socket.getPeerCertificate().subject.CN+' '+ 
    // req.method+' '+req.url)
    console.log(new Date()+' '+ 
    req.socket.remoteAddress+' '+ 
    // req.socket.getPeerCertificate().subject.CN+' '+ 
    req.method+' '+req.url); 
    next()
}

const { 
    privateKey: AUTH_SIGNER_KEY, 
    publicKey: AUTH_PUB_KEY 
} = crypto.generateKeyPairSync('rsa', {
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

function Aunthenticator({Issuer}){
    // function IDUser(user){
    //     const {username, password} = user.claims
    //     if (username === bob.username && password === bob.password){
    //         let access_token = jwt.sign(
    //             { username} , 
    //             {
    //                 key: AUTH_SIGNER_KEY,
    //                 passphrase:''
    //             }, 
    //             { algorithm: 'RS256' }
    //         );
    //         return access_token
    //     }
    //     else{
    //         throw new Error("Unable to id user")
    //     }
    // }
    function IDClient({claims}){
        const {
            client_secrete: CLIENT_SECRETE, 
            client_id: CLIENT_ID,
            tansaction,
            scope
        } = claims

        // verify if api key exists
        // const APIKeyData = db.clients.getByID(API_KEY)
        // const issuerDF = APIKeyData.issuerDF 

        const issuer = crypto.createDiffieHellman(Buffer.from(process.env.CLIENT_SECRETE_KEY))
        const issuerKey = issuer.generateKeys()

        const client = crypto.createDiffieHellman(Buffer.from(CLIENT_SECRETE))
        const clientKey = client.generateKeys()

        const clientSecret = client.computeSecret(issuerKey);
        const issuerSecret = issuer.computeSecret(clientKey);

        const isValidSecrete = assert.strictEqual(
            clientSecret.toString('hex'), 
            issuerSecret.toString('hex')
        );
        if (!isValidSecrete){
            throw new Error("invalid client secrete")
        }
        return jwt.sign(
            { scope } , 
            {
                key: AUTH_SIGNER_KEY,
                passphrase:''
            }, 
            { algorithm: 'RS256' }
        );
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
// const crypto = require('crypto');
// const assert = require('assert');
// const fs = require('fs')
// const forge = require('node-forge');
 
// // Generate Alice's keys...
const alice = crypto.createDiffieHellman(2048);
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
//     //     passphrase: 'top
// const bob = {
//     username: "bob",
//     password: "mrbombastic"
// }
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

// const { 
//     privateKey: AUTH_SIGNER_KEY, 
//     publicKey: AUTH_PUB_KEY 
// } = crypto.generateKeyPairSync('rsa', {
//     modulusLength: 2048,
//     publicKeyEncoding: {
//       type: 'spki',
//       format: 'pem'
//     },
//     privateKeyEncoding: {
//       type: 'pkcs8',
//       format: 'pem',
//       cipher: 'aes-256-cbc',
//       passphrase: ''
//     }
// });
// fs.writeFileSync(`auth-siger-private-key.pem`, AUTH_SIGNER_KEY)
// fs.writeFileSync(`auth-siger-public-key.pem`, AUTH_PUB_KEY)