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
                    "invalid_request", 
                    "GrantTypes.refreshTokenGrant.verify: wrong grant type provided"
                )
            }
            if(!this.isValidExpiredIdToken()){
                throw new ErrorWrapper(
                    "invalid_request",
                    "GrantTypes.refreshTokenGrant.verify: invalid id_token"
                )
            }
            const isValidRefreshToken = await this.isValidRefreshToken()
            if(!isValidRefreshToken){
                throw new ErrorWrapper(
                    "invalid request",
                    "GrantTypes.refreshTokenGrant: invalid refresh_token provided"
                )
            }
            try {
                await this.verifyClient()
                if(!this.clientOwnsIdToken()){
                    throw new ErrorWrapper(
                        "invalid_request",
                        `${ErrorScope}.refreshTokenGrant: client ${this.params.client_id} does not own id_token and refresh_token`
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
                    token:this.token.id_token,
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
        this.getTokenInfo = function (){
            const token = tokenCache.get(this.params.refresh_token)
            if(!token){
                throw new ErrorWrapper(
                    "invalid_request",
                    `${ErrorScope}.getTokenInfo: could not find refresh token information for ${this.params.refresh_token}`
                )
            }
            this.token = {
                id_token: token.id_token
            }
            return this
        }
        this.generateAccessToken = async function(){
            const {
                access_token, 
                at_hash,
                refresh_token,
                rt_hash
            } = await util.generateAccessToken({withRefreshToken:true})
            this.token = {
                ...this.token,
                access_token, 
                at_hash,
                refresh_token,
                rt_hash
            }
            return this
        }
        this.generateIdToken = async function(){
            const {at_hash, rt_hash, auth_time} = this.token
            const {
                sub,iss, aud,iat
            } = this.validExpiredToken
            const exp = 60 * 10;
            const id_token = await jwt.sign(
                {
                    sub,
                    iss,
                    aud,
                    at_hash,
                    rt_hash,
                    auth_time
                }, 
                { exp }
            );
            this.token = {...this.token, id_token, expiresIn: exp}
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