export default function makeTokenGrant({
    ErrorWrapper,
    ClientAuthenticity,
    ResponseType,
    GrantResponse,
    jwt,
    dataSource,
    isCodeOwner,
    util,
    tokenCache
}){
    return function TokenGrant(params){
        this.params = params
        this.isValidClient=false
        this.isValidResponseType=false
        this.sub=null
        this.responseType=null
        this.response=null
        this.token={}
        this.verify = async function(){
            if(!this.isValidResponseType()){
                throw new ErrorWrapper(
                    "invalid_request", 
                    "invalid response type for token grant"
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
            this.isValidClient = await client.verifyBySecret()
            if(!(await this.isCodeOwner())){
                throw new ErrorWrapper(
                    "audience and code mismatch",
                    "GrantTypes.tokenGrant"
                )
            }
            return this
        }
        this.isCodeOwner = async function(){
            const {sub, ...authorization_code} = await dataSource.get(this.params.code)
            this.sub = sub
            return isCodeOwner({
                client:{
                    id:this.params.client_id,
                    code:this.params.code},
                authorization_code
            })
        }
        this.isValidResponseType = function (){
            const responseType = new ResponseType(this.params)
            return responseType.isTokenGrant()
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
        //maybe should fail silently?
        this.cacheToken = function(){
            const cachePayload = {
                access_token: this.token.access_token,
                expires_in: this.token.expiresIn,
                id_token: this.token.id_token,
                refresh_token: this.token.refresh_token
            }
            tokenCache.insert(cachePayload)
            return this
        }
        this.generateIdToken = function(){
            const {at_hash,rt_hash} = this.token
            const id_token = jwt.sign(
                {
                    sub:this.sub,
                    iss:'https://auth.tiger-crunch.com',
                    aud: this.params.client_id,
                    auth_time: + new Date(),
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
        this.processResponse = function(){
            const response = new GrantResponse({token:this.token,...this.params})
            this.response = response.getTokenGrantResponse()
            return this
        }
        this.getResponse = function (){
            return this.response
        }
    }
}