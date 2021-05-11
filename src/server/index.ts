var fs = require('fs'); 
import * as crypto from 'crypto';
var jwt = require('jsonwebtoken');
export const options = { 
    key: fs.readFileSync('server-key.pem'), 
    cert: fs.readFileSync('server-crt.pem')
};
import logger from "./logger"
require("dotenv").config()
import express from 'express'
import helmet from 'helmet'
import uaParser from 'ua-parser-js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid';
import User from "./user"
const userUseCases = User.userUseCases
const app = express()
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

const { 
    privateKey: CLIENT_PRIV_KEY, 
    publicKey: CLIENT_PUB_KEY
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
const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex')

app.use(helmet())
app.use(cors({
    origin: ['tiger-crunch.com', 'https://tiger-crunch.com:8000'],
    credentials: true
}))
app.use(bodyParser.json())
app.use(cookieParser(AUTH_SIGNER_KEY))
app.use(logConnections)
app.use(async (req, res, next) =>{
    const {hash} =  await browserHash(req)
    Object.assign(req, {browserHash: hash})
    next()
})

app.get('/', async (req, res, next) => {
    const access_token = req.signedCookies['access_token']
    console.log(access_token)
    const host = req.get('host')
    const origin = req.get('origin')
    const fingerprint = req['browserHash']
    res.send(
        `Hello from host:${host}, 
        fingerprint:${JSON.stringify(fingerprint)}`
    )
})

app.get('/ua-integrity', async (req, res, next) => {
    return res.status(401).json({isValidUA: isVerifiedUA(req)})
})

app.post('/auth', async(req, res, next) => {
    const uaid = req['browserHash']
    const {claims} = req.body
    const isAuthentic = await isAuthenticated({claims})
    if (isAuthentic){
        console.time('encrypt')
        const serviceToken = jwt.sign(
            {
                uaid,
                uuid: uuidv4(), // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
                sub: claims.email,
                iss:'https://auth.tiger-crunch.com',
                aud: "client-id/domain",
                auth_time: + new Date()
            }, 
            {
                key: AUTH_SIGNER_KEY,
                passphrase:''
            }, 
            { 
                algorithm: 'RS256', 
                expiresIn: 60 * 60 
            }
        );
        console.timeEnd("encrypt")
        res.set({'Cache-Control':'no-store'})
        res.cookie('access_token', serviceToken, {
            expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
            secure: true,
            httpOnly: true,
            signed: true,
            domain: '.tiger-crunch.com'
          })
        return res.json({access_token: serviceToken})
    }
    return res.json({message: "wrong pin or email"})
})

app.post('/users', async (req, res, next) => {
    try {
        const userInput = req.body
        const userResponse = await userUseCases.createNewUser(userInput)
        res.status(201)
        return res.json(userResponse)
    } catch (error) {
        return res.status(422).json({error:error.message})
    }
})
app.post('/auth/2fa', async (req, res, next) => {
    const access_token = req.signedCookies['access_token']
    const { sub } = jwt.verify(access_token, AUTH_PUB_KEY)
    const proposedPIN = req.body.proposedPIN
    const data_url = await userUseCases.setUp2FA({
        email:sub,
        proposedPIN
    })
    return res.send(`<img src="${data_url}">`)
})
app.post('/auth/2fa/verify', async (req, res, next) => {
    const access_token = req.signedCookies['access_token']
    const otp = req.body.otp
    const { sub } = jwt.verify(access_token, AUTH_PUB_KEY)
    const isUser = await userUseCases.verify2faSetup({email:sub}, otp)
    return res.json({
        me:sub,
        success: isUser
    })
})
function isVerifiedUA(req){
    const incomingBrowserHash = req.browserHash
    const access_token = req.signedCookies['access_token']
    if(!access_token){
        return (!!access_token)
    }
    const {uaid: browserHash} = jwt.verify(access_token, AUTH_PUB_KEY)
    return (browserHash === incomingBrowserHash)
}
function browserHash(req) : Promise<{
    hash: string
    components?: object
}> {
    const userAgent = req.headers['user-agent']
    const au = uaParser(userAgent)
    const acceptHeaders = {
        accept: req.headers["accept"],
        language: req.headers["accept-language"],
    }
    const components = {
        useragent:au,
        acceptHeaders,
    }
    const fingerprint = {
        hash: sha256(JSON.stringify({components})),
        components
    }
    return Promise.resolve(fingerprint)
}

function logConnections(req, res, next){
    logger.info(new Date()+' '+ 
    req.socket.remoteAddress+' '+ 
    // req.socket.getPeerCertificate().subject.CN+' '+ 
    req.method+' '+req.url)
    next()
}



function requestPayment(sender, receiver){
    const senderPubKey = isAuthenticated(sender)
    const receiverPubKey = receiver

}


function processPayment(sender, receiver){
    const authenticSender = jwt.verify(sender.token, AUTH_PUB_KEY)
    const authenticReceiver = receiver.verify()
}

async function isAuthenticated(user, agent=null) : Promise<boolean>{
    return await userUseCases.verifyUser(user.claims)
}


export default app