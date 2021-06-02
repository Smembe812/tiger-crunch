export default function ({clientUseCases, dataSource, util, nonceManager}){
    const ErrorWrapper = util.ErrorWrapper
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
            if(!client_id || !client_secret){
                throw new Error("client credentials not provided")
            }
            try {
                const validClient = await clientUseCases.verifyClientBySecret({id:client_id, secret:client_secret})
                if(validClient && grant_type === "authorization_code"){
                    const {sub} = await dataSource.get(code)
                    const {access_token, at_hash} = await generateAccessToken()
                    const id_token = jwt.sign(
                        {
                            sub,
                            iss:'https://auth.tiger-crunch.com',
                            aud: client_id,
                            auth_time: + new Date(),
                            at_hash
                        }, 
                        { 
                            expiresIn: 60 * 10 
                        }
                    );
                    const refresh_token = await util.generateRandomCode()
                    token = {
                        access_token,
                        token_type: "Bearer",
                        refresh_token: refresh_token.code,
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
        async function generateAccessToken(){
           const {
               code:access_token, 
               c_hash:at_hash
            } = await util.generateRandomCode()
           return {access_token, at_hash}
       }
        return {
            codeGrant,
            implicitFlow,
            tokenGrant,
            hybridFlow
        }
    }
}