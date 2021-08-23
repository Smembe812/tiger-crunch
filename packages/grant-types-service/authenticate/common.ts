function makeCommmon ({jwt, sessionCacheClient, util}){
	async function generateIdToken(props:{
        sub: string;
        iss?: string;
        auth_time: string;
        at_hash: string;
        rt_hash?: string;
        scope: string;
        exp: number;
        aud: string;

    }): Promise <string> {
		const iss = 'https://auth.tiger-crunch.com'
		const idToken = await jwt.sign(
			{
				iss,
				...props,
			}, 
			{ exp: props.exp }
		)
		return idToken
	}
	function setSessionCache({idToken,exp}){
		const buff = Buffer.from(idToken.split('.')[2])
		const hex = buff.toString('hex')
		sessionCacheClient.set(hex,idToken)
		sessionCacheClient.expire(hex, exp)
	}
	function addToBlacklist({idToken, exp}){
		const buff = Buffer.from(idToken.split('.')[2])
		const hex = buff.toString('hex')
		sessionCacheClient.set(hex,idToken)
		sessionCacheClient.expire(hex, exp) 
	}
	return {generateIdToken, setSessionCache}
}