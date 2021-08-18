export default function makeBasicAuth({
    userUseCases,
    jwt,
    util,
    tokenCache
}){
    return class Basic {
        params;
        credentials;
        sub;
        sid;
        idToken;
        exp;
        response;
        constructor(params){
            this.params = params
            this.credentials = {
                email: this.params.email,
                proposedPIN: this.params.proposedPIN,
                otp: this.params.otp
            }
            this.exp = 60 * 60 * 24 * 7; // 7 days
            this.idToken=null
            this.sub=null
            this.sid=null
            this.response=null;
        }
        async verifySub(){
            const isValid = await userUseCases.verifyUser(this.credentials)
            const user = await userUseCases.getUser(this.credentials)
            this.sub = user.id
            return this
        }
        async generateIdToken(){
            const authTime = Math.floor(Date.now()/1000)
            this.idToken = await jwt.sign(
                {
                    sub:this.sub,
                    iss:'https://auth.tiger-crunch.com',
                    aud: this.params.client_id,
                    auth_time: authTime,
                    uah: this.params.uah
                }, 
                { exp:this.exp }
            );
            return this
        }
        async generateSessionId(){
            const sessionIdPayload = {
                uah:this.params.uah,
                clientId: this.params.client_id || null
            }
            this.sid = await util.generateSessionId(sessionIdPayload)
            return this
        }
        makeResponse(){
            return {
                id_token: this.idToken,
                sid: this.sid,
                exp: Math.floor((Date.now() + (1000 * this.exp))/1000)
            }
        }
        async cacheSession(){
            this.response = this.makeResponse()
            await tokenCache.cacheSession(this.response)
            return this
        }
        getResponse(){
            return this.response;
        }
    }
}