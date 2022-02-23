//setup environment variables
import path from 'path'
import dotenv from 'dotenv'
// dotenv.config()
dotenv.config({path:path.resolve(__dirname+'../../../../.env')})
//configure jwt
import util from '@smembe812/util'
const JWT = util.JWT
import keys, { KeyStore} from './keys'
const keyStore = new KeyStore()
const jwt = new JWT({
	keyStore
})
import URL from 'url'
import redis from "redis"
const redisOptions = {
    host: 'localhost',
    port: '6379',
}
const sessionCacheClient = redis.createClient(redisOptions);
sessionCacheClient.on("error", function(error) {
    console.error(error);
});
sessionCacheClient.set("key", "value", redis.print);
sessionCacheClient.expire("key", 60 * 5)
sessionCacheClient.get("key", redis.print);
// server config
export const options = {
	key: keys.SEVER_KEY,
	cert: keys.SEVER_CRT
}
// express middlewares
import express from 'express'
import helmet from 'helmet'
import uaParser from 'ua-parser-js'
import userAgent from 'express-useragent'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from 'body-parser'
import * as crypto from 'crypto'
import logger from './logger'
import basicAuth from 'basic-auth'
import User from '@smembe812/user-service'
import Client from '@smembe812/clients-service'
import { GrantTypes } from '@smembe812/grant-types-service/'
const grantTypes = GrantTypes({jwt, keys})
const userUseCases = User.userUseCases
const clientUseCases = Client.useCases
const app = express()
const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex')
app.use(helmet())
app.use(cors({
	origin: ['https://findyourcat.com','tiger-crunch.com', 'https://tiger-crunch.com:4433', 'https://auth.tiger-crunch.com:3000', 'https://client.tiger-crunch.com:3300'],
	credentials: true
}))
app.use(userAgent.express())
app.use(bodyParser.json())
//TODO change cookie signer secret
app.use(cookieParser(sha256('veryrandom')))
app.use(logConnections)
app.use(async (req, res, next) =>{
	const fingerprint =  await browserHash(req)
	// console.log(fingerprint)
	Object.assign(req, {browserHash: fingerprint.hash})
	next()
})
app.use(authenticateClient)
app.use(bearerAuth)

function authenticateClient(req, res, next){
	const headers = req.headers
	const authorization = headers['authorization']
	const isBasic = authorization?.includes('Basic') || false
	if(authorization && isBasic){
		const {pass:client_secret, name:client_id} = basicAuth(req)
		req.client = {client_id, client_secret}
	}
	next()
}

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
	// next cb takes error obj
	const uah = req['browserHash']
	const {claims} = req.body
	const {cb_token} = req.query
	let cb_params
	const id_token_params = {client:null,user:null}
	try {
		if(cb_token){
			cb_params = jwt.verify({token:cb_token})
			id_token_params.client = {domain: URL.parse(cb_params.redirect_uri).host}
		}
		const response = await grantTypes.basicFlow(claims)
		res.set({'Cache-Control':'no-store'})
		res.cookie('__IDT',  response.id_token, {
			expires: new Date(response.exp), // cookie will be removed after 14 hours
			secure: true,
			// httpOnly: true,
			signed: true,
			domain: '.tiger-crunch.com'
		})
		res.cookie('__SID',  response.sid, {
			expires: new Date(response.exp), // cookie will be removed after 14 hours
			secure: true,
			// httpOnly: true,
			signed: true,
			domain: '.tiger-crunch.com'
		})
		if (cb_params){
			return res.redirect(`/auth/code?${cb_params.raw_query}`)
		}
		return res.json(response)
	} catch (error) {
		console.log(error)
		return res.json({message: 'wrong pin or email'})
	}
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
	const { sub } = jwt.verify({token:access_token})
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
	const { sub } = jwt.verify({token:access_token})
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
	const raw_query = URL.parse(req.url).query
	const {
		response_type,
		scope,
		client_id,
		state,
		redirect_uri
	} = req.query as CodeQuery
	const client_domain = URL.parse(redirect_uri).host
	const id_token = req.signedCookies['__IDT']
	const {isAuthoritative, browser } = req['useragent']
	if(id_token){
		try {
			const { sub } = jwt.verify({token:id_token})
			if (!sub){
				const cb_token = await jwt.sign({raw_query, redirect_uri},{exp:60*5})
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
				const oh = URL.parse(req.headers['origin']).host
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
	const cb_token = await jwt.sign({raw_query, redirect_uri},{exp:60*5})
	return res.redirect(`https://auth.tiger-crunch.com:3000?cb=${cb_token}`)
})
app.post('/auth/token/', async(req:any, res, next) => {
	// Authenticate the Client if it was issued Client Credentials or if it uses another Client Authentication method, per Section 9.
	// Ensure the Authorization Code was issued to the authenticated Client.
	// Verify that the Authorization Code is valid.
	// If possible, verify that the Authorization Code has not been previously used.
	// Ensure that the redirect_uri parameter value is identical to the redirect_uri parameter value that was included in the initial Authorization Request. If the redirect_uri parameter value is not present when there is only one registered redirect_uri value, the Authorization Server MAY return an error (since the Client should have included the parameter) or MAY proceed without an error (since OAuth 2.0 permits the parameter to be omitted in this case).
	// Verify that the Authorization Code used was issued in response to an OpenID Connect Authentication Request (so that an ID Token will be returned from the Token Endpoint).
	const uah = req['browserHash']
	try {
		const {client_id, client_secret} = req.client
		const {grant_type,code,redirect_uri} = req.query
		const token = await grantTypes.tokenGrant({
			grant_type,
			code,
			redirect_uri,
			client_id,
			client_secret,
			uah
		})
		res.set({'Cache-Control':'no-store'})
		res.set({'Pragma': 'no-cache'})
		return res.json(token)
	} catch (error) {
		logger.error(error)
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
	const raw_query = URL.parse(req.url).query
	const {
		redirect_uri,
		response_type,
		client_id,
		scope,
		state,
		nonce
	} = req.query as ImplicitFlowQueryInput
	const client_domain = URL.parse(redirect_uri).host
	const id_token = req.signedCookies['__IDT']
	const {isAuthoritative, browser } = req['useragent']
	const uah = req['browserHash']
	if(id_token){
		try {
			const { sub } = jwt.verify({token:id_token})
			if (!sub){
				const cb_token = await jwt.sign({raw_query, redirect_uri},{exp:60*5})
				return res.redirect(`https://auth.tiger-crunch.com:3000/?cb=${cb_token}`)
			}
			const {redirectUri, sid} = await grantTypes.implicitFlow({
				domain:client_domain,
				response_type,
				scope,
				client_id,
				state,
				redirect_uri,
				sub,
				nonce,
				uah
			})
			if(req.headers['origin']){
				const oh = URL.parse(req.headers['origin']).host
				if(oh !== req.headers['host'] && isAuthoritative && browser){
					return res.json({redirectUri})
				}
			}
			if(sid){
				res.cookie('__SID',  sid, {
					expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
					secure: true,
					// httpOnly: true,
					signed: true,
					domain: client_domain
				})
			}
			res.set({'Cache-Control':'no-store'})
			res.set({'Pragma': 'no-cache'})
			return res.redirect(307,redirectUri)
		} catch (error) {
			logger.error(error)
			return res.redirect(307,error.description)
			// return res.json({error: error.message})
		}
	}
	const cb_token = await jwt.sign({raw_query, redirect_uri},{exp:60*5})
	return res.redirect(`https://auth.tiger-crunch.com:3000?cb=${cb_token}`)
})
app.get('/auth/hybrid/', async(req, res, next) => {
	// Authenticate the Client if it was issued Client Credentials or if it uses another Client Authentication method, per Section 9.
	// Ensure the Authorization Code was issued to the authenticated Client.
	// Verify that the Authorization Code is valid.
	// If possible, verify that the Authorization Code has not been previously used.
	// Ensure that the redirect_uri parameter value is identical to the redirect_uri parameter value that was included in the initial Authorization Request. If the redirect_uri parameter value is not present when there is only one registered redirect_uri value, the Authorization Server MAY return an error (since the Client should have included the parameter) or MAY proceed without an error (since OAuth 2.0 permits the parameter to be omitted in this case).
	// Verify that the Authorization Code used was issued in response to an OpenID Connect Authentication Request (so that an ID Token will be returned from the Token Endpoint).
	const raw_query = URL.parse(req.url).query
	const {
		redirect_uri,
		response_type,
		client_id,
		scope,
		state,
		nonce
	} = req.query as HybridFlowQueryInput
	const client_domain = URL.parse(redirect_uri).host
	const id_token = req.signedCookies['__IDT']
	const {isAuthoritative, browser } = req['useragent']
	const uah = req['browserHash']
	if(id_token){
		try {
			const { sub } = jwt.verify({token:id_token})
			if (!sub){
				const cb_token = await jwt.sign({raw_query, redirect_uri},{exp:60*5})
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
				nonce,
				uah
			})
			if(req.headers['origin']){
				const oh = URL.parse(req.headers['origin']).host
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
	const cb_token = await jwt.sign({raw_query, redirect_uri},{exp:60*5})
	return res.redirect(`https://auth.tiger-crunch.com:3000?cb=${cb_token}`)
})
app.post('/auth/refresh-token/', async(req:any, res, next) => {
	// Authenticate the Client if it was issued Client Credentials or if it uses another Client Authentication method, per Section 9.
	// Ensure the Authorization Code was issued to the authenticated Client.
	// Verify that the Authorization Code is valid.
	// If possible, verify that the Authorization Code has not been previously used.
	// Ensure that the redirect_uri parameter value is identical to the redirect_uri parameter value that was included in the initial Authorization Request. If the redirect_uri parameter value is not present when there is only one registered redirect_uri value, the Authorization Server MAY return an error (since the Client should have included the parameter) or MAY proceed without an error (since OAuth 2.0 permits the parameter to be omitted in this case).
	// Verify that the Authorization Code used was issued in response to an OpenID Connect Authentication Request (so that an ID Token will be returned from the Token Endpoint).
	const {client_id,client_secret} = req?.client
	const {grant_type,refresh_token,scope} = req.query as RefreshToken
	const uah = req['browserHash']
	try {
		const token = await grantTypes.refreshTokenGrant({
			grant_type,
			client_id,
			client_secret,
			refresh_token,
			scope,
			uah
		})
		res.set({'Cache-Control':'no-store'})
		res.set({'Pragma': 'no-cache'})
		return res.json(token)
	} catch (error) {
		logger.error(error)
		return res.json({error: error.message})
	}
})
app.post('/auth/introspection/', async(req:any, res, next) => {
	const {client_id,client_secret} = req?.client
	// Authenticate the Client if it was issued Client Credentials or if it uses another Client Authentication method, per Section 9.
	// Ensure the Authorization Code was issued to the authenticated Client.
	// Verify that the Authorization Code is valid.
	// If possible, verify that the Authorization Code has not been previously used.
	// Ensure that the redirect_uri parameter value is identical to the redirect_uri parameter value that was included in the initial Authorization Request. If the redirect_uri parameter value is not present when there is only one registered redirect_uri value, the Authorization Server MAY return an error (since the Client should have included the parameter) or MAY proceed without an error (since OAuth 2.0 permits the parameter to be omitted in this case).
	// Verify that the Authorization Code used was issued in response to an OpenID Connect Authentication Request (so that an ID Token will be returned from the Token Endpoint).
	const {token,token_hint} = req.query
	try {
		const response = await grantTypes.introspection({
			client_id,client_secret,token,token_hint
		})
		res.set({'Cache-Control':'no-store'})
		res.set({'Pragma': 'no-cache'})
		return res.json(response)
	} catch (error) {
		logger.error(error)
		return res.json({error: error.message})
	}
})
app.post('/auth/logout', async(req, res, next) => {
	const idToken = req.signedCookies['__IDT']
	const sid = req.signedCookies['__SID']
	const host = `https://${req.headers.host+req.path}`
	const events = JSON.parse(`{"${host}":{}}`)
	try {
		const response = await grantTypes.logoutFlow({sid, idToken,events})
		res.set({'Cache-Control':'no-store'})
		res.set({'Pragma': 'no-cache'})
		return res.json({id_token:response})
	} catch (error) {
		return res.status(400).json({error: 'bad request'})
	}
})
app.post('/clients', async (req, res) => {
	const {email, project_name, domain} = req.body
	const client = await clientUseCases.registerClient({email, projectName:project_name, domain})
	return res.json({...client})
})
app.get('/clients/verify', async (req, res) => {
	const {client_id, client_secret} = req.body
	const client = await clientUseCases.verifyClientBySecret({client_id, client_secret})
	const resp = await clientUseCases.getClient({id:client_id})
	return res.json({...resp})
})
app.get('/userinfo', async (req:any, res) => {
	const id_token = req.signedCookies['__IDT']
	const { sub } = jwt.verify({token:id_token})
	const userInfo = await userUseCases.getUser({id:sub, email:null})
	return res.json(userInfo)
})
app.get('/jwks', async (req, res) => {
	const ks = keyStore.keyStore
	return res.json(ks.toJSON())
})
app.on('listening', async () => {
	await keyStore.genetateKeys()
})
function bearerAuth(req, res, next){
	const headers = req.headers
	const authorization = headers['authorization']
	const isBearer = authorization?.includes('Bearer') || false
	if(authorization && isBearer){
		const access_token = authorization.split('Bearer ')[1]
		req.client = {access_token}
	}
	next()
}
function isVerifiedUA(req){
	const incomingBrowserHash = req.browserHash
	const id_token = req.signedCookies['__IDT']
	if(!id_token){
		return (!!id_token)
	}
	try {
		const {uaid: browserHash} = jwt.verify({token:id_token})
		return (browserHash === incomingBrowserHash)
	} catch (error) {
		console.log(error)
		return false
	}
}
function browserHash(req) : Promise<{
		hash: string;
		components?: unknown;
}> {
	const userAgent = req.headers['user-agent']
	const au = uaParser(userAgent)
	const acceptHeaders = {
		// accept: req.headers["accept"],
		language: req.headers['accept-language'],
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
export default app