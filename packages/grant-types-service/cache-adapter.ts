import LRU from 'lru-cache'
import util from '@smembe812/util'
import redis from 'redis'
//redis host for different environments
const REDIS_URI = process.env.REDIS_URI || 'localhost'
interface Token {
    access_token:string;
    expires_in:number;
    id_token:string;
    refresh_token:string;
    sid: string;
    token_type?:string;
}
export default class TokenCache {
	lru;
	tokenBase = 'tc:tokens:';
	userTokensSet = 'tc:userTokens:';
	userSessionsSet = 'tc:userSessions:';
	blacklist='tc:blacklist:'
	sessions = 'tc:sessions:';
	redisOptions = {
		host: REDIS_URI,
		port: '6379',
	}
	redisClient;
	constructor(options){
		if(!options?.maxSize){
			throw new Error('maxSize not set')
		}
		this.lru = new LRU(options.maxSize)
		this.redisClient = redis.createClient(this.redisOptions)
	}
	private expiresIn(exp){
		//exp in unixtime 
		return exp - Math.floor((Date.now())/1000)
	}
	private expiresOn(exp){
		return Math.floor((Date.now() + (1000 * exp))/1000)
	}
	cacheSession(payload){
		return new Promise((resolve, reject) => {
			const multi = this.redisClient.multi()
			multi.hmset(
				this.sessions+payload.sid,
				'it', payload.id_token
			)
				.expire(this.sessions+payload.sid, this.expiresIn(payload.exp))
				.zadd(
					this.userSessionsSet+payload.sub,
					payload.exp, payload.sid
				)
				.exec((err, res)=>{
					if(err) return reject(err)
					return resolve(res)
				})
		})
	}
	setCache(token){ 
		return new Promise((resolve, reject) => {
			//Math.floor((Date.now() + (1000 * refreshTokenExp))/1000)
			const refreshTokenExp = 60 * 60 * 24
			const multi = this.redisClient.multi()
			multi.hmset(this.tokenBase+token.access_token, 
				'rt', token.refresh_token,
				'it', token.id_token
			)
				.expire(this.tokenBase+token.access_token, token.expires_in)
				.hmset(this.sessions+token.sid,
					'at', token.access_token,
					'rt', token.refresh_token,
					'it', token.id_token,
					'exp', token.expires_in
				)
				.zadd(this.userTokensSet+token.sub,
					this.expiresOn(token.expires_in), token.access_token
				)
				.zadd(this.userSessionsSet+token.sub, 
					this.expiresOn(token.expires_in), token.sid
				)
			if(token.refresh_token){
				multi.hmset(this.tokenBase+token.refresh_token,
					'at', token.access_token,
					'it', token.id_token
				)
					.expire(this.tokenBase+token.refresh_token, refreshTokenExp)
					.zadd(this.userTokensSet+token.sub,
						this.expiresIn(token.expires_in), token.refresh_token
					)
			}   
			multi.exec((err, res) => {
				if (err) return reject(err)
				return resolve(res)
			})
		})
	}
	getToken(token){
		return new Promise((resolve, reject) => {
			this.redisClient
				.hgetall(`${this.tokenBase}${token}`, (err, res) => {
					if (err) return reject(err)
					return resolve(res)
				})
		})
	}
	async getUserTokens (userId,options:{isActive: boolean}=null) : Promise <string[]>{
		const key = this.userTokensSet+userId
		return await this.getSortedSet(key, options)
	}
	private getSortedSet(key,options:{isActive: boolean}=null):Promise <string[]>{
		return new Promise((resolve, reject) => {
			let rangeStart
			const rangeEnd='+inf'
			if(!options){
				rangeStart = '-inf'
			}else if(options.isActive){
				rangeStart = Math.floor(Date.now() / 1000)
			}
			this.redisClient.zrangebyscore([
				key,
				rangeStart,
				rangeEnd
			], (err, res) => {
				if(err) return reject(err)
				return resolve(res)
			})
		})
	}
	async getUserSessions(userId,options:{isActive: boolean}=null) : Promise <string[]>{
		const key = this.userSessionsSet+userId
		return await this.getSortedSet(key, options)
	}
	getSessionDetails(sid):Promise<{
			it:string;
			rt:string;
			at:string;
			exp:number;
	}>{
		return new Promise((resolve, reject) => {
			this.redisClient
				.hgetall(`${this.sessions}${sid}`, (err, res) => {
					if(err) return reject(err)
					return resolve(res)
				})
		})
	}
	async logout(sid){
		const sessionDetails = await this.getSessionDetails(sid)
		if(!sessionDetails){
			return Promise.reject(new Error('invalid session id'))
		}
		const payloadBase64url = sessionDetails.it.split('.')[1]
		const payloadDetails = Buffer.from(payloadBase64url, 'base64').toString('binary')
		const payload = JSON.parse(payloadDetails)
		const hash = await util.generateItHash(sessionDetails.it)
		const jti = hash.digest('hex')
		const multi = this.redisClient.multi()
		multi.del(this.sessions+sid)
		if(this.tokenBase+sessionDetails.rt && this.tokenBase+sessionDetails.at){
			multi.del(
				this.tokenBase+sessionDetails.rt,
				this.tokenBase+sessionDetails.at,
			)
		}
		multi.set(this.blacklist+jti, sid)
			.expire(this.blacklist+jti, this.expiresIn(payload.exp))
			.exec((err, res)=>{
				if (err) return Promise.reject(err)
				return Promise.resolve({...payload,jti})
			})
	}
	async getActiveUserSession(userId){
		const userSessions:string[] = await this.getUserSessions(userId)
		return userSessions.filter(async (session) => {
			const sessionDetails = await this.getSessionDetails(session)
			const payloadBase64url = sessionDetails.it.split('.')[1]
			const payloadDetails = Buffer.from(payloadBase64url, 'base64').toString('binary')
			const payload = JSON.parse(payloadDetails)
			const now = Math.floor(Date.now() / 1000)
			return payload.exp < now
		})
	}
	insert(token:Token):boolean{
		if(!token?.access_token){
			throw new TypeError(
				'token Object must have access_token'
			)
		}
		if(!token?.refresh_token){
			throw new TypeError(
				'token Object must have refresh_token'
			)
		}
		return this.cache(token)
	}
	private cacheOnAccessToken(token){
		if(!token?.expires_in){
			return this.lru.set(token.access_token, token)
		}
		return this.lru.set(token.access_token, token, token.expires_in * 1000)
	}
	private cacheOnRefreshToken(token){
		return this.lru.set(token.refresh_token, token)
	}
	private cache(token){
		this.cacheOnRefreshToken(token)
		return this.cacheOnAccessToken(token)
	}
	get(opaque_token){
		return this.lru.get(opaque_token)
	}
	delete(opaque_token){
		return this.lru.del(opaque_token)
	}
	getSize(){
		return this.lru.itemCount
	}
	clear(){
		return this.lru.reset()
	}
	hasToken(opaque_token){
		return this.lru.has(opaque_token)
	}
}