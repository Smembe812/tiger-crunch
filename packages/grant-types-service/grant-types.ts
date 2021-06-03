import { Response } from "node-fetch"

export default function ({clientUseCases, dataSource, util, nonceManager}){
    const ErrorWrapper = util.ErrorWrapper
    const ErrorScope="GrantTypes"
    return function GrantTypes({jwt, keys}){
        async function codeGrant(params){
            //TODO: verify scope
            const {state,redirect_uri} = params
            try {
                const codeFlow = new AthorizationCode(params)
                await codeFlow.verify()
                await codeFlow.generateCode()
                codeFlow.processResponse()
                const response = codeFlow.getResponse()
                return response
            } catch (error) {
                if (error.message === "invalid_request"){
                    return `${redirect_uri}?error=invalid_request&error_description=unauthorized_client&state=${state}`
                }
                throw error
            }
        }
        async function implicitFlow(params) : Promise <string>{
            const {redirect_uri,state} = params
            try {
                const implicitFlow = new ImplicitFlow(params)
                await implicitFlow.verify()
                await implicitFlow.generateAccessToken()
                implicitFlow.generateIdToken()
                implicitFlow.processResponse()
                const response = implicitFlow.getResponse()
                return response
            } catch (error) {
                return `${redirect_uri}?error=invalid_request&error_description=${error.message}&state=${state}`
            }
        }
        async function hybridFlow(params):Promise<string>{
            const {redirect_uri,response_type,client_id,scope,state,nonce, domain, sub} = params
            try {
                const validClient = await clientUseCases.verifyClientByDomain({id:client_id, domain})
                const {code, c_hash} = await util.generateRandomCode()
                await dataSource.insert({code,client_id,sub})
                if(validClient){
                    const isAuthenticNonce = await nonceManager.isAuthenticNonce(nonce)
                    if(!isAuthenticNonce){
                        throw new ErrorWrapper(
                            "nonce not unique",
                            "GrantTypes.hybridFlow"
                        )
                    }
                    await nonceManager.persistNonce({
                        nonce,
                        sub,
                        state,
                        client_id,
                        response_type,
                        scope
                    })
                    const expires_in = 60 * 5
                    const id_token = jwt.sign(
                        {
                            sub,
                            iss:'https://auth.tiger-crunch.com',
                            aud: client_id,
                            auth_time: + new Date(),
                            c_hash,
                            nonce
                        }, 
                        { 
                            expiresIn: expires_in
                        }
                    );
                    const response_url = `${redirect_uri}?id_token=${id_token}&code=${code}&state=${state}`
                    return response_url
                }
            } catch (error) {
                return `${redirect_uri}?error=invalid_request&error_description=${error.message}&state=${state}`
            }
        }
        async function tokenGrant(params):Promise<object>{
            try {
                const tokenFlow = new TokenGrant(params)
                await tokenFlow.verify()
                await tokenFlow.generateAccessToken()
                tokenFlow.generateIdToken()
                tokenFlow.processResponse()
                const response = tokenFlow.getResponse()
                return response
            } catch (error) {
                throw error
            }
        }
        async function refreshTokenGrant(params):Promise<object>{
            try {
                const refreshTokenFlow = new RefreshTokenGrant(params)
                await refreshTokenFlow.verify()
                await refreshTokenFlow.generateAccessToken()
                refreshTokenFlow.generateIdToken()
                refreshTokenFlow.processResponse()
                const response = refreshTokenFlow.getResponse()
                return response
            } catch (error) {
                throw error
            }
        }
        async function generateAccessToken(options=null){
            let tokens, rt={};
            if (options?.withRefreshToken === true){
                const {
                    code:refresh_token, 
                    c_hash:rt_hash
                 } = await util.generateRandomCode()
                rt = {refresh_token, rt_hash}
            }
            const {
               code:access_token, 
               c_hash:at_hash
            } = await util.generateRandomCode()
            tokens = {...rt, access_token, at_hash}
            return tokens
        }
        function isCodeOwner(params){
           const {client, authorization_code} = params
           return (client.id === authorization_code.client_id && client.code === authorization_code.code)
        }
        async function hasClientCredentials(credentials):Promise<boolean>{
            const {client_secret,client_id} = credentials
            if(!client_id || !client_secret){
                throw new Error("client credentials not provided")
            }
            return true
        }
        function GrantFlow(params){
            this.params = params
            this.validClient = false
            this.code=null
            this.redirectUriResponce=null
            this.next = null
            this.setNext= setNext.bind(this)
            this._getResponse = _getResponse.bind(this)
            function setNext(nextFlow){
                this.next = nextFlow.bind(this)
            }
            function _getResponse(){
                if(this.next){
                    this.next()
                }
                if(this.redirectUriResponce){
                    return this.redirectUriResponce
                }
                return null
            }
        }
        function AthorizationCode(params){
            this.params = params
            this.isValidClient=false
            this.isValidResponseType=false
            this.code=null
            this.responseType=null
            this.response=null
            this.verify = async function(){
                if(!this.isValidResponseType()){
                    throw new ErrorWrapper(
                        "invalid_request", 
                        "invalid response type for code flow"
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
                return this.isValidResponseType = responseType.isAthorizationCode()
            }
            this.generateCode = async function(){
                const code = new AuthorizationCode(this.params)
                await code.makeCode()
                await code.persist()
                this.code = code.get()
                return this
            }
            this.processResponse = function(){
                const response = new GrantResponse({code:this.code,...this.params})
                this.response = response.getAuthorizationCodeRedirectUri()
                return this
            }
            this.getResponse = function (){
                return this.response
            }
        }
        function ImplicitFlow(params){
            this.params = params
            this.isValidClient=false
            this.isValidResponseType=false
            this.code=null
            this.responseType=null
            this.response=null
            this.verify = async function(){
                if(!this.isValidResponseType()){
                    throw new ErrorWrapper(
                        "invalid_request", 
                        "invalid response type for implicit flow"
                    )
                }
                const nonceIsAuthentic = await this.isAuthenticNonce() 
                if(!nonceIsAuthentic){
                    throw new ErrorWrapper(
                        "nonce not unique",
                        "GrantTypes.implicitFlow"
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
                return this.isValidResponseType = responseType.isIdTokenToken()
            }
            this.isAuthenticNonce = async function(){
                const isUnique = await nonceManager.isAuthenticNonce(this.params.nonce)
                await nonceManager.persistNonce({
                    nonce:this.params.nonce,
                    sub:this.params.sub,
                    redirect_uri:this.params.redirect_uri,
                    state:this.params.state,
                    client_id:this.params.client_id,
                    response_type:this.params.response_type,
                    scope:this.params.scope
                })
                return isUnique
            }
            this.generateAccessToken = async function(){
                const {
                    access_token, 
                    at_hash
                } = await generateAccessToken()
                this.token = {
                    access_token, 
                    at_hash
                }
                return this
            }
            this.generateIdToken = function(){
                const {at_hash} = this.token
                const expiresIn = 60 * 5
                const id_token = jwt.sign(
                    {
                        sub:this.params.sub,
                        iss:'https://auth.tiger-crunch.com',
                        aud: this.params.client_id,
                        auth_time: + new Date(),
                        at_hash,
                    }, 
                    { 
                        expiresIn
                    }
                );
                this.token = {id_token, ...this.token, expiresIn, token_type:"bearer"}
                return this
            }
            this.processResponse = function(){
                const response = new GrantResponse({token:this.token,...this.params})
                this.response = response.getImplicitFLowRedirectUri()
                return this
            }
            this.getResponse = function (){
                return this.response
            }
        }
        function TokenGrant(params){
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
                } = await generateAccessToken({withRefreshToken:true})
                this.token = {
                    access_token, 
                    at_hash,
                    refresh_token,
                    rt_hash
                }
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
        function RefreshTokenGrant(params){
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
                } = await generateAccessToken({withRefreshToken:true})
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
            this.processResponse = function(){
                const response = new GrantResponse({token:this.token,...this.params})
                this.response = response.getRefreshTokenGrantResponse()
                return this
            }
            this.getResponse = function (){
                return this.response
            }
        }
        function GrantResponse(params){
            const {redirect_uri, code, state,token} = params
            this.params = {redirect_uri, code, state, token}
            this.token = this.params.token
            this.getAuthorizationCodeRedirectUri = function(){
                return `${this.params.redirect_uri}?code=${this.params.code}&state=${this.params.state}`
            }
            this.getImplicitFLowRedirectUri = function (){
                return `${redirect_uri}?id_token=${this.token.id_token}&access_token=${this.token.access_token}&token_type=${this.token.token_type}&state=${state}&expires_in=${this.token.expiresIn}`
            }
            this.setToken = function (){
                const {
                    access_token,
                    refresh_token,
                    expiresIn,
                    id_token
                } = this.params.token
                this.token = {
                    access_token,
                    token_type: "Bearer",
                    refresh_token,
                    expires_in:expiresIn,
                    id_token
                }
                return this
            }
            this.getTokenGrantResponse = function(){
                this.setToken()
                return this.token
            }
            this.getRefreshTokenGrantResponse = function(){
                this.setToken()
                return this.token
            }
        }
        function AuthorizationCode(params){
            const {client_id,sub} = params
            this.params = {client_id, sub}
            this.code=null
            this.makeCode = async function(){
                const {code} = await util.generateRandomCode()
                this.code = code
                return this
            }
            this.persist = async function(){
                await dataSource.insert({code:this.code,...this.params})
                return this
            }
            this.get = function(){
                return this.code
            }
        }
        function ResponseType(params){
            const {response_type, grant_type} = params
            this.params = {response_type, grant_type}
            this.isAthorizationCode = function(){
                return this.params.response_type === "code"
            }
            this.isTokenGrant = function (){
                return this.params.grant_type === "authorization_code"
            }
            this.isRefreshTokenGrant = function (){
                return this.params.grant_type === "refresh_token"
            }
            this.isIdTokenToken = function (){
                return this.params.response_type = "id_token token"
            }
        }
        function ClientAuthenticity(params){
            const {client_id, client_secret, domain} = params
            this.params = {client_id, client_secret, domain}
            this.verifyByDomain = async function(){
                try {
                    this.validClient = await clientUseCases.verifyClientByDomain({
                        id:this.params.client_id, 
                        domain:this.params.domain
                    })
                    return true
                } catch (error) {
                    throw error
                }
            }
            this.verifyBySecret = async function(){
                try {
                    await hasClientCredentials({client_id,client_secret})
                    await clientUseCases.verifyClientBySecret({id:client_id, secret:client_secret})
                    this.isValidClient = true
                    return this.isValidClient
                } catch (error) {
                    throw error
                }
            }
            this.get = function (){
                return this.isValidClient
            }
        }
        return {
            codeGrant,
            implicitFlow,
            tokenGrant,
            hybridFlow,
            refreshTokenGrant
        }
    }
}