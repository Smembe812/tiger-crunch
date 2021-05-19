import Client from "@smembe812/clients-service"
export default function ({client=null, jwt, keys, datasource=null}){
    const clientUseCases = Client.useCases
    async function codeGrant(params){
        //TODO: verify scope
        const {response_type,scope,client_id,state,redirect_uri, origin} = params
        try {
            const validClient = await clientUseCases.verifyClientByDomain({id:client_id, origin})
            if(validClient && response_type === "code"){
                const code = await generateRandomCode()
                return `${redirect_uri}?code=${code}&state=${state}`
            }
        } catch (error) {
            throw error
        }
        return `${redirect_uri}?error=invalid_request&error_description=Unsupported%20response_type%20value&state=${state}`
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
        const {grant_type,code,redirect_uri} = params
        if(grant_type === "authorization_code"){
            const {access_token, at_hash} = await generateAccessToken()
            const id_token = jwt.sign(
                {
                    sub: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
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
                refresh_token: await generateRandomCode(),
                expires_in: 60 * 10,
                id_token
            }
        }else{
            token = {error: "invalid_request"}
        }
        return token
    }
    async function generateAccessToken(){
        const access_token = await generateRandomCode()
        const base64url = toBase64Url(Buffer.from(access_token))
        const at_hash = base64url.slice(0,(base64url.length/2))
        return {access_token, at_hash}
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
    async function generateRandomCode():Promise<string>{
        const {randomFill} = await import('crypto');
        return new Promise((resolve, reject) => {
            const buf = Buffer.alloc(10);
            randomFill(buf, (err, buf) => {
            if (err) throw err;
                resolve(buf.toString('hex'))
            });
        })
    }
    return{
        codeGrant,
        tokenGrant,
        implicitFlow
    }
}