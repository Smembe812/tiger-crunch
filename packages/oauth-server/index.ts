var fs = require('fs'); 
import * as crypto from 'crypto';
import JWT from "./jwt-wrapper"
import keys, {AUTH_SIGNER_KEY, AUTH_PUB_KEY} from './keys'
const jwt = new JWT({algo:'RS256', signer:{key:AUTH_SIGNER_KEY, passphrase:""}})
export const options = { 
    key: keys.SEVER_KEY, 
    cert: keys.SEVER_CRT
};
import logger from "./logger"
import path from 'path'
require("dotenv").config({path:path.resolve(__dirname+"../../../../.env")})
import express from 'express'
import helmet from 'helmet'
import uaParser from 'ua-parser-js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid';
import User from '@tiger-crunch/user-service'
import Client from "@tiger-crunch/clients-service"
import AuthGrants from "./grant-types/grant-types"
const userUseCases = User.userUseCases
const clientUseCases = Client.useCases
const app = express()
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
    const { sub } = jwt.verify({token:access_token, key:AUTH_PUB_KEY})
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
    const { sub } = jwt.verify({token:access_token, key:AUTH_PUB_KEY})
    const isUser = await userUseCases.verify2faSetup({email:sub}, otp)
    return res.json({
        me:sub,
        success: isUser
    })
})
app.post('/auth/code', async(req, res, next) => {
    //verify client
    //verify user scope
    //check/verify user
    //redirect with code
    const {response_type,scope,client_id,state,redirect_uri} = req.query
    if(response_type === "code"){
        const code = await generateRandomCode()
        return res.redirect(`${redirect_uri}?code=${code}&state=${state}`)
    }
    return res.redirect(`${redirect_uri}?error=invalid_request&error_description=Unsupported%20response_type%20value&state=${state}`)
})
app.post('/auth/token/', async(req, res, next) => {
    // Authenticate the Client if it was issued Client Credentials or if it uses another Client Authentication method, per Section 9.
    // Ensure the Authorization Code was issued to the authenticated Client.
    // Verify that the Authorization Code is valid.
    // If possible, verify that the Authorization Code has not been previously used.
    // Ensure that the redirect_uri parameter value is identical to the redirect_uri parameter value that was included in the initial Authorization Request. If the redirect_uri parameter value is not present when there is only one registered redirect_uri value, the Authorization Server MAY return an error (since the Client should have included the parameter) or MAY proceed without an error (since OAuth 2.0 permits the parameter to be omitted in this case).
    // Verify that the Authorization Code used was issued in response to an OpenID Connect Authentication Request (so that an ID Token will be returned from the Token Endpoint).
    const {grant_type,code,redirect_uri} = req.query
    res.set({'Cache-Control':'no-store'})
    res.set({'Pragma': 'no-cache'})
    const token = await AuthGrants({jwt, keys}).tokenGrant({grant_type,code,redirect_uri})
    return res.json(token)
})
app.get('/auth/implicit/', async(req, res, next) => {
    // Authenticate the Client if it was issued Client Credentials or if it uses another Client Authentication method, per Section 9.
    // Ensure the Authorization Code was issued to the authenticated Client.
    // Verify that the Authorization Code is valid.
    // If possible, verify that the Authorization Code has not been previously used.
    // Ensure that the redirect_uri parameter value is identical to the redirect_uri parameter value that was included in the initial Authorization Request. If the redirect_uri parameter value is not present when there is only one registered redirect_uri value, the Authorization Server MAY return an error (since the Client should have included the parameter) or MAY proceed without an error (since OAuth 2.0 permits the parameter to be omitted in this case).
    // Verify that the Authorization Code used was issued in response to an OpenID Connect Authentication Request (so that an ID Token will be returned from the Token Endpoint).
    
    const {redirect_uri,response_type,client_id,scope,state,nonce} = req.query
    const params = {redirect_uri,response_type,client_id,scope,state,nonce}
    res.set({'Cache-Control':'no-store'})
    res.set({'Pragma': 'no-cache'})
    const token = await AuthGrants({jwt, keys}).implicitFlow({...params})
    return res.redirect(`${token.redirect_uri}?access_token=${token.access_token}&state=${token.state}&token_type=${token.token_type}&id_token=${token.id_token}&expires_in=${token.expires_in}`)
})
app.post('/clients', async (req, res) => {
    const {email, project_name, domain} = req.body
    const client = await clientUseCases.registerClient({email, project_name, domain})
    return res.json({...client})
})
app.get('/clients/verify', async (req, res) => {
    const {id, client_key} = req.body
    const client = await clientUseCases.verifyClient({id, client_key})
    console.log(client)
    return res.json({...client})
})
async function generateRandomCode(){
    const {randomFill,} = await import('crypto');
    return new Promise((resolve, reject) => {
        const buf = Buffer.alloc(10);
        randomFill(buf, (err, buf) => {
        if (err) throw err;
            resolve(buf.toString('hex'))
        });
    })
}
function isVerifiedUA(req){
    const incomingBrowserHash = req.browserHash
    const access_token = req.signedCookies['access_token']
    if(!access_token){
        return (!!access_token)
    }
    const {uaid: browserHash} = jwt.verify({token:access_token, key:AUTH_PUB_KEY})
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

async function isAuthenticated(user, agent=null) : Promise<boolean>{
    return await userUseCases.verifyUser(user.claims)
}


export default app