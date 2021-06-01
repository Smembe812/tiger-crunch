//setup environment variables
import path from 'path'
require("dotenv").config({path:path.resolve(__dirname+"../../../../.env")})
//configure jwt
import util from "@smembe812/util"
const JWT = util.JWT
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
import userAgent from 'express-useragent'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from 'body-parser'

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import logger from "./logger"

import User from '@smembe812/user-service'
import Client from "@smembe812/clients-service"
import makeGrantTypes from "@smembe812/grant-types-service/"
const grantTypes = makeGrantTypes.GrantTypes({jwt, keys})
const userUseCases = User.userUseCases
const clientUseCases = Client.useCases
const app = express()
const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex')
app.use(helmet())
app.use(cors({
    origin: ['https://findyourcat.com','tiger-crunch.com', 'https://tiger-crunch.com:4433', "https://auth.tiger-crunch.com:3000"],
    credentials: true
}))
app.use(userAgent.express())
app.use(bodyParser.json())
//TODO change cookie signer secret
app.use(cookieParser(AUTH_SIGNER_KEY.toString('utf-8')))
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
    let isAuthentic;
    const uaid = req['browserHash']
    const {claims} = req.body
    const {cb_token} = req.query
    let cb_params;
    let id_token_params = {client:null,user:null}
    try {
        if(cb_token){
            cb_params = jwt.verify({token:cb_token, key:AUTH_PUB_KEY})
            id_token_params.client = {domain: require("url").parse(cb_params.redirect_uri).host}
        }
        isAuthentic = await isAuthenticated({claims})
        if (isAuthentic){
            const user = await userUseCases.getUser(claims)
            id_token_params.user = user
            const id_token = jwt.sign({
                sub: user.uuid,
                aud: !id_token_params.client ? "tiger-crunch.com": id_token_params.client.domain,
                iss:'https://auth.tiger-crunch.com',
                uaid,
                auth_time: + new Date()
            },
            {expiresIn:60*60})
            res.set({'Cache-Control':'no-store'})
            res.cookie('access_token',  id_token, {
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
        console.log(error)
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
    const client_domain = require("url").parse(redirect_uri).host
    const access_token = req.signedCookies['access_token']
    const {isAuthoritative, browser } = req["useragent"]
    if(access_token){
        try {
            const { sub } = jwt.verify({token:access_token})
            if (!sub){
                const cb_token = jwt.sign({raw_query, redirect_uri},{expiresIn:60*5})
                return res.redirect(`https://auth.tiger-crunch.com:3000/?cb=${cb_token}`)
            }
            const redirectUri = await grantTypes.codeGrant({
                domain:client_domain,
                response_type,
                scope,
                client_id,
                state,
                redirect_uri,
                sub
            })
            if(req.headers['origin']){
                const oh = require('url').parse(req.headers['origin']).host
                if(oh !== req.headers['host'] && isAuthoritative && browser){
                    return res.json({redirectUri})
                }
            }
            return res.redirect(307,redirectUri)
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
    try {
        const {grant_type,code,redirect_uri, client_id, client_key} = req.query
        const token = await grantTypes.tokenGrant({grant_type,code,redirect_uri, client_id, client_key})
        res.set({'Cache-Control':'no-store'})
        res.set({'Pragma': 'no-cache'})
        return res.json(token)
    } catch (error) {
        logger.error(error);
        return res.json({error: error.message})
    }
})
app.get('/auth/implicit/', async(req, res, next) => {
    // Authenticate the Client if it was issued Client Credentials or if it uses another Client Authentication method, per Section 9.
    // Ensure the Authorization Code was issued to the authenticated Client.
    // Verify that the Authorization Code is valid.
    // If possible, verify that the Authorization Code has not been previously used.
    // Ensure that the redirect_uri parameter value is identical to the redirect_uri parameter value that was included in the initial Authorization Request. If the redirect_uri parameter value is not present when there is only one registered redirect_uri value, the Authorization Server MAY return an error (since the Client should have included the parameter) or MAY proceed without an error (since OAuth 2.0 permits the parameter to be omitted in this case).
    // Verify that the Authorization Code used was issued in response to an OpenID Connect Authentication Request (so that an ID Token will be returned from the Token Endpoint).
    const raw_query = require("url").parse(req.url).query
    const {redirect_uri,response_type,client_id,scope,state,nonce} = req.query
    const client_domain = require("url").parse(redirect_uri).host
    const access_token = req.signedCookies['access_token']
    const {isAuthoritative, browser } = req["useragent"]
    if(access_token){
        try {
            const { sub } = jwt.verify({token:access_token})
            if (!sub){
                const cb_token = jwt.sign({raw_query, redirect_uri},{expiresIn:60*5})
                return res.redirect(`https://auth.tiger-crunch.com:3000/?cb=${cb_token}`)
            }
            const redirectUri = await grantTypes.implicitFlow({
                domain:client_domain,
                response_type,
                scope,
                client_id,
                state,
                redirect_uri,
                sub,
                nonce
            })
            if(req.headers['origin']){
                const oh = require('url').parse(req.headers['origin']).host
                if(oh !== req.headers['host'] && isAuthoritative && browser){
                    return res.json({redirectUri})
                }
            }
            res.set({'Cache-Control':'no-store'})
            res.set({'Pragma': 'no-cache'})
            return res.redirect(307,redirectUri)
        } catch (error) {
            logger.error(error)
            return res.json({error: error.message})
        }
    }
    const cb_token = jwt.sign({raw_query, redirect_uri},{expiresIn:60*5})
    return res.redirect(`https://auth.tiger-crunch.com:3000?cb=${cb_token}`)
})
app.get('/auth/hybrid/', async(req, res, next) => {
    // Authenticate the Client if it was issued Client Credentials or if it uses another Client Authentication method, per Section 9.
    // Ensure the Authorization Code was issued to the authenticated Client.
    // Verify that the Authorization Code is valid.
    // If possible, verify that the Authorization Code has not been previously used.
    // Ensure that the redirect_uri parameter value is identical to the redirect_uri parameter value that was included in the initial Authorization Request. If the redirect_uri parameter value is not present when there is only one registered redirect_uri value, the Authorization Server MAY return an error (since the Client should have included the parameter) or MAY proceed without an error (since OAuth 2.0 permits the parameter to be omitted in this case).
    // Verify that the Authorization Code used was issued in response to an OpenID Connect Authentication Request (so that an ID Token will be returned from the Token Endpoint).
    const raw_query = require("url").parse(req.url).query
    const {redirect_uri,response_type,client_id,scope,state,nonce} = req.query
    const client_domain = require("url").parse(redirect_uri).host
    const access_token = req.signedCookies['access_token']
    const {isAuthoritative, browser } = req["useragent"]
    if(access_token){
        try {
            const { sub } = jwt.verify({token:access_token})
            if (!sub){
                const cb_token = jwt.sign({raw_query, redirect_uri},{expiresIn:60*5})
                return res.redirect(`https://auth.tiger-crunch.com:3000/?cb=${cb_token}`)
            }
            const redirectUri = await grantTypes.hybridFlow({
                domain:client_domain,
                response_type,
                scope,
                client_id,
                state,
                redirect_uri,
                sub,
                nonce
            })
            if(req.headers['origin']){
                const oh = require('url').parse(req.headers['origin']).host
                if(oh !== req.headers['host'] && isAuthoritative && browser){
                    return res.json({redirectUri})
                }
            }
            res.set({'Cache-Control':'no-store'})
            res.set({'Pragma': 'no-cache'})
            return res.redirect(307,redirectUri)
        } catch (error) {
            logger.error(error)
            return res.json({error: error.message})
        }
    }
    const cb_token = jwt.sign({raw_query, redirect_uri},{expiresIn:60*5})
    return res.redirect(`https://auth.tiger-crunch.com:3000?cb=${cb_token}`)
})
app.post('/clients', async (req, res) => {
    const {email, project_name, domain} = req.body
    const client = await clientUseCases.registerClient({email, projectName:project_name, domain})
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

async function generateIdToken({user, client}, options):Promise<string>{
    const {expires_in} = options
    const token = jwt.sign({
        sub: user.uuid,
        aud: !client ? "tiger-crunch.com": client.domain,
        iss:'https://auth.tiger-crunch.com'
    },
    {expiresIn:expires_in})
    return token
}

export default app