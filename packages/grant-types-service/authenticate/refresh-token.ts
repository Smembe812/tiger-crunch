export default function makeRefreshTokenGrant({
    ErrorWrapper,
    ClientAuthenticity,
    ResponseType,
    GrantResponse,
    util,
    jwt,
    tokenCache,
    ErrorScope,
}){
    return function RefreshTokenGrant(params){
        this.params = params
        this.isValidClient=false
        this.response=null
        this.token={}
        this.validExpiredToken={}
        this.verify = async function(){
            if(!this.isValidResponseType()){
                throw new ErrorWrapper(
                    "invalid grant type", 
                    "invalid response type for token grant"
                )
            }
            if(!this.isValidExpiredIdToken()){
                throw new ErrorWrapper(
                    "invalid id_token provided",
                    "GrantTypes.refreshTokenGrant"
                )
            }
            const isValidRefreshToken = await this.isValidRefreshToken()
            if(!isValidRefreshToken){
                throw new ErrorWrapper(
                    "invalid refresh_token provided",
                    "GrantTypes.refreshTokenGrant"
                )
            }
            try {
                await this.verifyClient()
                if(!this.clientOwnsIdToken()){
                    throw new ErrorWrapper(
                        "client does not own the id_token",
                        `${ErrorScope}.refreshTokenGrant`
                    )
                }
                return this
            } catch (error) {
                throw error
            }
        }
        this.verifyClient = async function(){
            const client = new ClientAuthenticity(this.params)
            this.isValidClient = await client.verifyBySecret()
            return this
        }
        this.isValidResponseType = function (){
            const responseType = new ResponseType(this.params)
            return responseType.isRefreshTokenGrant()
        }
        this.isValidExpiredIdToken = function(){
            try {
                const validExpiredToken = jwt.verify({
                    token:this.params.id_token,
                    options:{ ignoreExpiration: true}
                })
                if(validExpiredToken){
                    this.validExpiredToken = validExpiredToken
                    return true
                }
            } catch (error) {
                throw error
            }
        }
        this.isValidRefreshToken = async function (){
            const {rt_hash} = this.validExpiredToken
            const isValid = await util.verifyCode(this.params.refresh_token,rt_hash)
            return isValid
        }
        this.clientOwnsIdToken = function(){
            return this.params.client_id === this.validExpiredToken.aud
        }
        this.generateAccessToken = async function(){
            const {
                access_token, 
                at_hash,
                refresh_token,
                rt_hash
            } = await util.generateAccessToken({withRefreshToken:true})
            this.token = {
                access_token, 
                at_hash,
                refresh_token,
                rt_hash
            }
            return this
        }
        this.generateIdToken = function(){
            const {at_hash, rt_hash} = this.token
            const {
                sub,iss, aud,auth_time
            } = this.validExpiredToken
            const id_token = jwt.sign(
                {
                    sub,
                    iss,
                    aud,
                    auth_time,
                    at_hash,
                    rt_hash
                }, 
                { 
                    expiresIn: 60 * 10 
                }
            );
            this.token = {id_token, ...this.token, expiresIn: 60 * 10}
            return this
        }
        this.cacheToken = function(){
            tokenCache.insert(this.token)
            return this
        }
        this.processResponse = function(){
            const response = new GrantResponse({token:this.token,...this.params})
            this.response = response.getRefreshTokenGrantResponse()
            return this
        }
        this.getResponse = function (){
            return this.response
        }
    }
}