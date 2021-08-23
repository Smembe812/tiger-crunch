import jwt from 'jsonwebtoken'
import jwktopem from 'jwk-to-pem'
export default class JWT{
	#jwt;
	private keyStore;
	private defaultExp;
	constructor({keyStore=null}){
		this.#jwt = jwt
		this.keyStore = keyStore
		this.defaultExp = 60 * 10 //10 minutes;
	}
	async sign(payload, options=null){
		if (!this.keyStore){
			throw new TypeError('jwk keystore not provided')
		}
		let exp
		if(!options?.exp){
			exp = this.defaultExp
		}else{
			exp = options.exp
		}
		const pyl = {
			exp: Math.floor((Date.now() + (1000 * exp))/1000),
			iat: Math.floor(Date.now() / 1000),
			...payload
		}
		const signer = this.keyStore.createSign()
		return await signer.update(JSON.stringify(pyl)).final()
	}
	verify({token, options=null}){
		if(!token){
			throw new TypeError('id_token not provided')
		}
		const [key] = this.keyStore.keyStore.toJSON().keys
		const publicKey = jwktopem(key)
		return this.#jwt.verify(token,publicKey,options)
	}
}