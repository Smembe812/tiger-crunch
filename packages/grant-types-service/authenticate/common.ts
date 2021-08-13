function makeCommmon ({jwt, sessionCacheClient, util}){
    async function generateIdToken(props:{
        sub: String;
        iss?: String;
        auth_time: String;
        at_hash: String;
        rt_hash?: String;
        scope: String;
        exp: Number;
        aud: String;

    }): Promise <string> {
        const iss = 'https://auth.tiger-crunch.com';
        const idToken = await jwt.sign(
            {
                iss,
                ...props,
            }, 
            { exp: props.exp }
        );
        return idToken
    }
    function setSessionCache({idToken,exp}){
        const buff = Buffer.from(idToken.split('.')[2])
        const hex = buff.toString("hex")
        sessionCacheClient.set(hex,idToken)
        sessionCacheClient.expire(hex, exp)
    }
    return {generateIdToken, setSessionCache}
}