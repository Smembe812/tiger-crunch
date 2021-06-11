export default function makeGrantTypes({
    clientUseCases, 
    dataSource, 
    tokenCache, 
    util, 
    nonceManager, 
    Authenticate
}){
    const {
        makeAuthorizationCodeFlow,
        makeTokenGrant,
        makeImplicitFlow,
        makeHybridFlow,
        makeRefreshTokenGrant,
        makeIntrospection
    } = Authenticate
    const ErrorWrapper = util.ErrorWrapper
    const ErrorScope="GrantTypes"
    return function GrantTypes({jwt, keys}){
        const AuthorizationCodeFlow = makeAuthorizationCodeFlow({
            ErrorWrapper,
            ClientAuthenticity,
            ResponseType,
            AuthorizationCode,
            GrantResponse
        })
        const TokenGrant = makeTokenGrant({
            ErrorWrapper,
            ClientAuthenticity,
            ResponseType,
            GrantResponse,
            jwt,
            dataSource,
            isCodeOwner,
            util,
            tokenCache
        })
        const ImplicitFlow = makeImplicitFlow({
            ErrorWrapper,
            ClientAuthenticity,
            ResponseType,
            GrantResponse,
            nonceManager,
            util,
            jwt
        })
        const HybridFlow = makeHybridFlow({
            ErrorWrapper,
            ClientAuthenticity,
            AuthorizationCode,
            ResponseType,
            GrantResponse,
            nonceManager,
            util,
            jwt
        })
        const RefreshTokenGrant = makeRefreshTokenGrant({
            ErrorWrapper,
            ClientAuthenticity,
            ResponseType,
            GrantResponse,
            util,
            jwt,
            ErrorScope,
            tokenCache
        })
        const Introspection = makeIntrospection({
            ErrorWrapper,
            ClientAuthenticity,
            jwt,
            tokenCache,
            ErrorScope,
        })
        async function codeGrant(params){
            //TODO: verify scope
            const {state,redirect_uri} = params
            try {
                const codeFlow = new AuthorizationCodeFlow(params)
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
            const {redirect_uri,state} = params
            try {
                const hybridFlow = new HybridFlow(params)
                await hybridFlow.verify()
                await hybridFlow.generateAccessToken()
                await hybridFlow.generateCode()
                hybridFlow.generateIdToken()
                hybridFlow.processResponse()
                const response = hybridFlow.getResponse()
                return response
            } catch (error) {
                console.log(error)
                return `${redirect_uri}?error=invalid_request&error_description=${error.message}&state=${state}`
            }
        }
        async function tokenGrant(params):Promise<object>{
            try {
                const tokenFlow = new TokenGrant(params)
                await tokenFlow.verify()
                await tokenFlow.generateAccessToken()
                tokenFlow.generateIdToken()
                await tokenFlow.cacheToken()
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
                refreshTokenFlow.getTokenInfo()
                await refreshTokenFlow.verify()
                await refreshTokenFlow.generateAccessToken()
                refreshTokenFlow.generateIdToken()
                refreshTokenFlow.cacheToken()
                refreshTokenFlow.processResponse()
                const response = refreshTokenFlow.getResponse()
                return response
            } catch (error) {
                throw error
            }
        }
        async function introspection(params):Promise<object>{
            let response;
            try {
                const introspect = new Introspection(params)
                await introspect.verify()
                introspect.decodeIdToken()
                introspect.processResponse()
                response = introspect.getResponse()
                return response
            } catch (error) {
                if (error.message === "client does not own the id_token"){
                    response = {active:false}
                    return response
                }
                throw error
            }
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
        function GrantResponse(params){
            const {redirect_uri, code, state,token, response_type} = params
            this.params = {redirect_uri, code, state, token, response_type}
            this.token = this.params.token
            this.code = this.params.code
            this.getAuthorizationCodeRedirectUri = function(){
                const REPLACE = 'REPLACE'
                const baseUri = `${redirect_uri}REPLACE&state=${state}`
                let redirectUri;
                switch(this.params.response_type){
                    case "code":
                        redirectUri = baseUri.replace(REPLACE, `?code=${this.params.code}`)
                        break;
                    default:
                        redirectUri = baseUri.replace(REPLACE,`?error=invalid_request&error_description=invalid_response_type`)
                        break;
                }
                return redirectUri
            }
            this.getImplicitFLowRedirectUri = function (){
                const REPLACE = 'REPLACE'
                const baseUri = `${redirect_uri}REPLACE&state=${state}`
                let redirectUri;
                switch(this.params.response_type){
                    case "id_token":
                        redirectUri = baseUri.replace(REPLACE, `?id_token=${this.token.id_token}`)
                        break;
                    case "id_token token":
                        redirectUri = baseUri.replace(REPLACE, `?id_token=${this.token.id_token}&access_token=${this.token.access_token}&token_type=${this.token.token_type}&expires_in=${this.token.expiresIn}`)
                        break;
                    default:
                        redirectUri = baseUri.replace(REPLACE,`?error=invalid_request&error_description=invalid_response_type`)
                        break;
                }
                return redirectUri
            }
            this.getHybridFlowRedirectUri = function (){
                const REPLACE = 'REPLACE'
                const baseUri = `${redirect_uri}${REPLACE}&state=${state}`
                let redirectUri;
                switch(this.params.response_type){
                    case "code id_token":
                        redirectUri = baseUri.replace(REPLACE, `?id_token=${this.token.id_token}&code=${this.code}`)
                        break;
                    case "code token":
                        redirectUri = baseUri.replace(REPLACE, `?access_token=${this.token.access_token}&token_type=${this.token.token_type}&expires_in=${this.token.expiresIn}&code=${this.code}`)
                        break;
                    case "code id_token token":
                        redirectUri = baseUri.replace(REPLACE, `?id_token=${this.token.id_token}&access_token=${this.token.access_token}&token_type=${this.token.token_type}&expires_in=${this.token.expiresIn}&code=${this.code}`)
                        break;
                    default:
                        redirectUri = baseUri.replace(REPLACE,`?error=invalid_request&error_description=invalid_response_type`)
                        break;
                }
                return redirectUri
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
            const CODE_FLOW = ["code"]
            const IMPLICIT_FLOW = ['id_token', 'token']
            const HYBRID_FLOW = ['code', 'id_token', 'token']
            const {response_type, grant_type} = params
            this.params = {response_type, grant_type}
            this.isAthorizationCode = function(){
                return (this.params.response_type === CODE_FLOW[0])
            }
            this.isTokenGrant = function (){
                return this.params.grant_type === "authorization_code"
            }
            this.isRefreshTokenGrant = function (){
                return this.params.grant_type === "refresh_token"
            }
            this.isImplicit = function (){
                const response_type = this.params.response_type
                return (
                    response_type === `${IMPLICIT_FLOW[0]}`
                    || response_type === `${IMPLICIT_FLOW[0]} ${IMPLICIT_FLOW[1]}`
                )
            }
            this.isHybrid = function (){
                const response_type = this.params.response_type
                return (
                    response_type === `${HYBRID_FLOW[0]} ${HYBRID_FLOW[1]}`
                    || response_type === `${HYBRID_FLOW[0]} ${HYBRID_FLOW[2]}`
                    || response_type === `${HYBRID_FLOW[0]} ${HYBRID_FLOW[1]} ${HYBRID_FLOW[2]}`
                )
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
            refreshTokenGrant,
            introspection
        }
    }
}