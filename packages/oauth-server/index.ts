//setup environment variables
import path from 'path'
require("dotenv").config({path:path.resolve(__dirname+"../../../../.env")})
//configure jwt
import JWT from "./jwt-wrapper"
import keys, {AUTH_SIGNER_KEY, AUTH_PUB_KEY} from './keys'
const jwt = new JWT({
    algo:'RS256', 
    signer:{key:AUTH_SIGNER_KEY, passphrase:""},
    verifier:AUTH_PUB_KEY
})
// server config
export const options = { 
    key: keys.SEVER_KEY, 
    cert: keys.SEVER_CRT
};
// express middlewares
import express from 'express'
import helmet from 'helmet'
import uaParser from 'ua-parser-js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from 'body-parser'

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import logger from "./logger"

import User from '@smembe812/user-service'
import Client from "@smembe812/clients-service"
import AuthGrants from "./grant-types/grant-types"

const grantTypes = AuthGrants({jwt, keys})
const userUseCases = User.userUseCases
const clientUseCases = Client.useCases
const app = express()
const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex')
app.use(helmet())
app.use(cors({
    origin: ['tiger-crunch.com', 'https://tiger-crunch.com:8000', "https://auth.tiger-crunch.com:3000"],
    // origin: "*",
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
    console.log(req.hostname, req.get("origin"))
    let isAuthentic;
    const uaid = req['browserHash']
    const {claims} = req.body
    const {cb_token} = req.query
    let cb_params;
    if(cb_token){
        cb_params = jwt.verify({token:cb_token, key:AUTH_PUB_KEY})
    }
    try {
        isAuthentic = await isAuthenticated({claims})
        if (isAuthentic){
            const user = await userUseCases.getUser(claims)
            const client = {domain:cb_params.redirect_uri}
            const id_token = await generateIdToken({
                user,
                client
            },{
                expires_in: 60 * 60
            })
            res.set({'Cache-Control':'no-store'})
            res.cookie('access_token', id_token, {
                expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
                secure: true,
                httpOnly: true,
                signed: true,
                domain: '.tiger-crunch.com'
            })
            if (cb_params){
                return res.redirect(`/auth/code?${cb_params.raw_query}`)
            }
            return res.json({access_token: id_token})
        }
    } catch (error) {
        return res.json({message: "wrong pin or email"})
    }
    return res.json({message: "wrong pin or email"})
})

app.post('/users', async (req, res, next) => {
    try {
        console.log(req.hostname, req.get("origin"))
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
app.get('/auth/code', async(req, res, next) => {
    //verify client
    //verify user scope
    //check/verify user
    //redirect with code
    const raw_query = require("url").parse(req.url).query
    const {response_type,scope,client_id,state,redirect_uri} = req.query
    const origin = req.get('origin')
    const access_token = req.signedCookies['access_token']
    if(access_token){
        const { sub } = jwt.verify({token:access_token, key:AUTH_PUB_KEY})
        if (!sub){
            const cb_token = jwt.sign({raw_query, redirect_uri},{expiresIn:60*5})
            return res.redirect(`/auth?cb=${cb_token}`)
        }
        try {
            const redirectUri = await grantTypes.codeGrant({
                origin,
                response_type,
                scope,
                client_id,
                state,
                redirect_uri,
                sub
            })
            return res.redirect(redirectUri)
            
        } catch (error) {
            logger.error(error)
            return res.json({error: error.message})
        }
    }
    const cb_token = jwt.sign({raw_query, redirect_uri},{expiresIn:60*5})
    return res.redirect(`https://auth.tiger-crunch.com:3000?cb=${cb_token}`)
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
    const token = await grantTypes.tokenGrant({grant_type,code,redirect_uri})
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
    const token = await grantTypes.implicitFlow({...params})
    return res.redirect(`${token.redirect_uri}?access_token=${token.access_token}&state=${token.state}&token_type=${token.token_type}&id_token=${token.id_token}&expires_in=${token.expires_in}`)
})
app.post('/clients', async (req, res) => {
    const {email, project_name, domain} = req.body
    const client = await clientUseCases.registerClient({email, project_name, domain})
    return res.json({...client})
})
app.get('/clients/verify', async (req, res) => {
    const {id, client_key} = req.body
    const client = await clientUseCases.verifyClientBySecret({id, client_key})
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
    try {
        return await userUseCases.verifyUser(user.claims)
    } catch (error) {
        throw error
    }
}

async function generateIdToken({user, client}, options){
    const {expires_in} = options
    return jwt.sign({
        sub: user.id,
        aud: client.domain,
        iss:'https://auth.tiger-crunch.com'
    },
    {expiresIn:expires_in}
    )
}

export default app