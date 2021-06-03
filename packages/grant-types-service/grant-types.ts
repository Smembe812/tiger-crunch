export default function ({clientUseCases, dataSource, util, nonceManager}){
    const ErrorWrapper = util.ErrorWrapper
    const ErrorScope="GrantTypes"
    return function GrantTypes({jwt, keys}){
        async function codeGrant(params){
            //TODO: verify scope
            const {response_type,scope,client_id,state,redirect_uri, domain, sub} = params
            try {
                const validClient = await clientUseCases.verifyClientByDomain({id:client_id, domain})
                if(validClient && response_type === "code"){
                    const {code} = await util.generateRandomCode()
                    await dataSource.insert({code,client_id,sub})
                    return `${redirect_uri}?code=${code}&state=${state}`
                }
            } catch (error) {
                if (error.message === "invalid_request"){
                    return `${redirect_uri}?error=invalid_request&error_description=unauthorized_client&state=${state}`
                }
                throw error
            }
        }
        async function implicitFlow(params) : Promise <string>{
            const {redirect_uri,response_type,client_id,scope,state,nonce, domain, sub} = params
            try {
                const {access_token, at_hash} = await generateAccessToken()
                const validClient = await clientUseCases.verifyClientByDomain({id:client_id, domain})
                if(validClient){
                    const isAuthenticNonce = await nonceManager.isAuthenticNonce(nonce)
                    if(!isAuthenticNonce){
                        throw new ErrorWrapper(
                            "nonce not unique",
                            "GrantTypes.implicitFlow"
                        )
                    }
                    await nonceManager.persistNonce({
                        nonce,
                        sub,
                        redirect_uri,
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
                            aud: redirect_uri,
                            auth_time: + new Date(),
                            at_hash,
                            nonce
                        }, 
                        { 
                            expiresIn: expires_in
                        }
                    );
                    const token_type="bearer"
                    const response_url = `${redirect_uri}?id_token=${id_token}&access_token=${access_token}&token_type=${token_type}&state=${state}&expires_in=${expires_in}`
                    return response_url
                }
            } catch (error) {
                // console.log(
                //     "GrantTypes.implicitFlow",
                //     error
                // )
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
        async function tokenGrant(params){
            let token;
            const {grant_type,code,redirect_uri, client_id, client_secret} = params
            try {
                await hasClientCredentials({client_id,client_secret})
                const validClient = await clientUseCases.verifyClientBySecret({id:client_id, secret:client_secret})
                if(validClient && grant_type === "authorization_code"){
                    const {sub, ...authorization_code} = await dataSource.get(code)
                    if (!isCodeOwner({client:{id:client_id, code},authorization_code})){
                        throw new ErrorWrapper(
                            "audience and code mismatch",
                            "GrantTypes.tokenGrant"
                        )
                    }
                    const {
                        access_token, 
                        at_hash,
                        refresh_token,
                        rt_hash
                    } = await generateAccessToken({withRefreshToken:true})
                    const id_token = jwt.sign(
                        {
                            sub,
                            iss:'https://auth.tiger-crunch.com',
                            aud: client_id,
                            auth_time: + new Date(),
                            at_hash,
                            rt_hash
                        }, 
                        { 
                            expiresIn: 60 * 10 
                        }
                    );
                    token = {
                        access_token,
                        token_type: "Bearer",
                        refresh_token: refresh_token,
                        expires_in: 60 * 10,
                        id_token
                    }
                }else{
                    if (!validClient){
                        throw new Error("wrong client_id or client_secret provided")
                    }
                    throw new Error("invalid_request")
                }
                return token
            } catch (error) {
                throw error
            }
        }
        async function refreshTokenGrant(params){
            const {client_id, client_secret, grant_type, refresh_token, scope, id_token} = params
            let token;
            try {
                await hasClientCredentials({client_id,client_secret})
                const validClient = await clientUseCases.verifyClientBySecret({id:client_id, secret:client_secret})
                const validExpiredToken = jwt.verify({
                    token:id_token,
                    options:{ ignoreExpiration: true}
                })
                //TODO: verify if client owns refresh_token
                if(client_id !== validExpiredToken.aud){
                    throw new ErrorWrapper(
                        "client does not own the id_token",
                        `${ErrorScope}.refreshTokenGrant`
                        )
                }
                if(validClient && grant_type === "refresh_token"){
                    const {
                        sub,iss, aud,auth_time,rt_hash
                    } = validExpiredToken
                    const isValidRefreshToken = await util.verifyCode(refresh_token,rt_hash)
                    if (isValidRefreshToken){
                        const {
                            access_token, 
                            at_hash,
                            refresh_token,
                            rt_hash
                        } = await generateAccessToken({withRefreshToken:true})
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
                        token = {
                            access_token,
                            token_type: "Bearer",
                            refresh_token,
                            expires_in: 60 * 10,
                            id_token
                        }
                        return token
                    }
                    throw new Error("invalid refresh_token provided")
                }
                if(!validClient){
                    throw new Error("wrong client_id or client_secret provided")
                }
                throw new ErrorWrapper(
                    "invalid grant type",
                    "GrantTypes.refreshTokenGrant"
                )
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
        return {
            codeGrant,
            implicitFlow,
            tokenGrant,
            hybridFlow,
            refreshTokenGrant
        }
    }
}