export default function makeHybridFlow({
    ErrorWrapper,
    ClientAuthenticity,
    AuthorizationCode,
    ResponseType,
    GrantResponse,
    nonceManager,
    util,
    jwt
}){
    return function HybridFlow(params){
        this.params = params
        this.isValidClient=false
        this.isValidResponseType=false
        this.code=null
        this.responseType=null
        this.response=null
        this.auth_time = (+ new Date/1000)
        this.verify = async function(){
            if(!this.isValidResponseType()){
                throw new ErrorWrapper(
                    "invalid_request", 
                    "invalid response type for hybrid flow"
                )
            }
            const nonceIsAuthentic = await this.isAuthenticNonce() 
            if(!nonceIsAuthentic){
                throw new ErrorWrapper(
                    "nonce not unique",
                    "GrantTypes.hybridFlow"
                )
            }
            try {
                await this.verifyClient()
                return this
            } catch (error) {
                throw error
            }
        }
        this.verifyClient = async function(){
            const client = new ClientAuthenticity(this.params)
            this.isValidClient = await client.verifyByDomain()
            return this
        }
        this.isValidResponseType = function (){
            const responseType = new ResponseType(this.params)
            this.response_type = this.params.response_type
            return this.isValidResponseType = responseType.isHybrid()
        }
        this.isAuthenticNonce = async function(){
            const isUnique = await nonceManager.isAuthenticNonce(this.params.nonce)
            await nonceManager.persistNonce({
                nonce:this.params.nonce,
                sub:this.params.sub,
                state:this.params.state,
                client_id:this.params.client_id,
                response_type:this.params.response_type,
                scope:this.params.scope
            })
            return isUnique
        }
        this.generateCode = async function(){
            const code = new AuthorizationCode(this.params)
            await code.makeCode()
            await code.persist()
            this.code = code.get()
            return this
        }
        this.generateAccessToken = async function(){
            const {
                access_token, 
                at_hash
            } = await util.generateAccessToken()
            this.token = {
                access_token, 
                at_hash
            }
            return this
        }
        this.generateIdToken = async function(){
            const {at_hash} = this.token
            const exp = 60 * 5
            const id_token = await jwt.sign(
                {
                    sub:this.params.sub,
                    iss:'https://auth.tiger-crunch.com',
                    aud: this.params.client_id,
                    auth_time: this.auth_time,
                    at_hash,
                }, 
                { exp }
            );
            this.token = {id_token, ...this.token, expiresIn: exp, token_type:"bearer"}
            return this
        }
        this.processResponse = function(){
            const response = new GrantResponse({token:this.token,code:this.code,...this.params})
            this.response = response.getHybridFlowRedirectUri()
            return this
        }
        this.getResponse = function (){
            return this.response
        }
    }
}