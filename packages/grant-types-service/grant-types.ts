export default function ({clientUseCases, dataSource, util}){
    return function GrantTypes({jwt, keys}){
        async function codeGrant(params){
            //TODO: verify scope
            const {response_type,scope,client_id,state,redirect_uri, domain, sub} = params
            try {
                const validClient = await clientUseCases.verifyClientByDomain({id:client_id, domain})
                if(validClient && response_type === "code"){
                    const code = await util.generateRandomCode()
                    await dataSource.insert({code,sub})
                    return `${redirect_uri}?code=${code}&state=${state}`
                }
            } catch (error) {
                if (error.message === "invalid_request"){
                    return `${redirect_uri}?error=invalid_request&error_description=unauthorized_client&state=${state}`
                }
                throw error
            }
        }
        async function implicitFlow(params) {
            const {redirect_uri,response_type,client_id,scope,state,nonce} = params
            console.log(response_type)
            const {access_token, at_hash} = await generateAccessToken()
            const expires_in = 60 * 5
            const id_token = jwt.sign(
                {
                    uuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
                    sub: "claims.email",
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
            return {id_token, expires_in, access_token, state, token_type,redirect_uri}
        }
        async function tokenGrant(params){
            let token;
            const {grant_type,code,redirect_uri, client_id, client_key} = params
            try {
                const validClient = await clientUseCases.verifyClientBySecret({id:client_id, client_key})
                if(validClient && grant_type === "authorization_code"){
                    const sub = await dataSource.get(code)
                    const {access_token, at_hash} = await generateAccessToken()
                    const id_token = jwt.sign(
                        {
                            sub,
                            iss:'https://auth.tiger-crunch.com',
                            aud: redirect_uri,
                            auth_time: + new Date(),
                            at_hash
                        }, 
                        { 
                            expiresIn: 60 * 10 
                        }
                    );
                    token = {
                        access_token,
                        token_type: "Bearer",
                        refresh_token: await util.generateRandomCode(),
                        expires_in: 60 * 10,
                        id_token
                    }
                }else{
                    token = {error: "invalid_request"}
                }
                return token
            } catch (error) {
                throw error
            }
        }
        async function generateAccessToken(){
           const access_token = await util.generateRandomCode()
           const base64url = toBase64Url(Buffer.from(access_token))
           const at_hash = base64url.slice(0,(base64url.length/2))
           return {access_token, at_hash}
       }
        return {
            codeGrant,
            implicitFlow,
            tokenGrant
        }
    }
    
    function toBase64Url(word){
        return word.toString('base64').split('+').join("-").split('/').join("_")
    }
    async function createShaHash(alg, word){
        const {createHash} = await import("crypto")
        const hash = createHash(alg)
        hash.update(word)
        return hash.digest("base64")
    }
}