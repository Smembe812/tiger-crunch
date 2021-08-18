export default function makeTokenGrant({
    ErrorWrapper,
    ClientAuthenticity,
    ResponseType,
    GrantResponse,
    jwt,
    dataSource,
    isCodeOwner,
    util,
    tokenCache,
    permissionsUseCases
}){
    return function TokenGrant(params){
        this.params = params
        this.isValidClient=false
        this.isValidResponseType=false
        this.sub=null
        this.responseType=null
        this.response=null
        this.sid=null
        this.token={}
        this.auth_time = (+ new Date/1000)
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
            const {sub, permissions, ...authorization_code} = await dataSource.get(this.params.code)
            this.sub = sub
            // need to fail silently,
            // if permissions to not exist, just ignore
            const allowedPermissions = await permissionsUseCases.getAvailablePermission({
                id: this.sub,
                permissions: permissions
            })
            this.scope = `openid ${allowedPermissions}`
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
        this.generateSessionId = async function generateSessionId(){
            const sessionIdPayload = {
                uah:this.params.uah,
                clientId: this.params.client_id
            }
            this.sid = await util.generateSessionId(sessionIdPayload)
            return this
        }
        //maybe should fail silently?
        this.cacheToken = async function(){
            const cachePayload = {
                access_token: this.token.access_token,
                expires_in: this.token.expiresIn,
                id_token: this.token.id_token,
                refresh_token: this.token.refresh_token,
                sid: this.sid,
                sub: this.sub
            }
            await tokenCache.setCache(cachePayload)
            // tokenCache.insert(cachePayload)
            return this
        }
        this.generateIdToken = async function(){
            const {at_hash,rt_hash} = this.token
            const exp = 60 * 10;
            const id_token = await jwt.sign(
                {
                    sub:this.sub,
                    iss:'https://auth.tiger-crunch.com',
                    aud: this.params.client_id,
                    at_hash,
                    rt_hash,
                    auth_time: this.auth_time,
                    scope: this.scope,
                    uah: this.params.uah
                }, 
                { exp }
            );
            this.token = {id_token, ...this.token, expiresIn: exp}
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