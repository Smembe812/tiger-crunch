import LRU from 'lru-cache';
interface Token{
    access_token:string;
    expires_in:number,
    id_token:string;
    refresh_token:String,
    token_type?:string;
}
export default class TokenCache {
    lru
    constructor(options){
        if(!options?.maxSize){
            throw new Error("maxSize not set")
        }
        this.lru = new LRU(options.maxSize)
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