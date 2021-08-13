import LRU from 'lru-cache';
import redis from "redis"
interface Token {
    access_token:string;
    expires_in:number;
    id_token:string;
    refresh_token:String;
    sid: String;
    token_type?:string;
}
export default class TokenCache {
    lru;
    tokenBase = "tc:tokens:";
    userTokensSet = "tc:userTokens:";
    userSessionsSet = "tc:userSessions:";
    sessions = "tc:sessions:";
    redisOptions = {
        host: 'localhost',
        port: '6379',
    }
    redisClient;
    constructor(options){
        if(!options?.maxSize){
            throw new Error("maxSize not set")
        }
        this.lru = new LRU(options.maxSize)
        this.redisClient = redis.createClient(this.redisOptions);
    }
    setCache(token){ 
        return new Promise((resolve, reject) => {
            const refreshTokenExp = 60 * 60 * 24
            const multi = this.redisClient.multi()
            multi.hmset(this.tokenBase+token.access_token, 
                    "rt", token.refresh_token,
                    "it", token.id_token
                )
                .expire(this.tokenBase+token.access_token, token.expires_in)
                .hmset(this.sessions+token.sid,
                    "at", token.access_token,
                    "rt", token.refresh_token,
                    "it", token.id_token
                )
                .sadd(this.userSessionsSet+token.sub,
                    token.sid
                )
                .sadd(this.userTokensSet+token.sub,
                    token.access_token
                )
                if(token.refresh_token){
                    multi.hmset(this.tokenBase+token.refresh_token,
                        "at", token.access_token,
                        "it", token.id_token
                    )
                    .expire(this.tokenBase+token.refresh_token, refreshTokenExp)
                    .sadd(this.userTokensSet+token.sub,
                        token.refresh_token
                    )
                }   
            multi.exec((err, res) => {
                if (err) reject(err);
                return resolve(res)
            })
        })
    }
    getToken(token){
        return new Promise((resolve, reject) => {
            this.redisClient
                .hgetall(`${this.tokenBase}${token}`, (err, res) => {
                    if (err) reject(err)
                    return resolve(res)
                })
        })
    }
    insert(token:Token):boolean{
        if(!token?.access_token){
            throw new TypeError(
                "token Object must have access_token"
            )
        }
        if(!token?.refresh_token){
            throw new TypeError(
                "token Object must have refresh_token"
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
        try {
            this.cacheOnRefreshToken(token)
            return this.cacheOnAccessToken(token)
        } catch (error) {
            throw error
        }
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