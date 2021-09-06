import fs from 'fs'
import jose from 'node-jose'
// import jwktopem from "jwk-to-pem"
import Fifo from 'fifo'
export class KeyStore{
	keyStore;
	signer;
	_keyOptions;
	_fifo;
	constructor(){
		this._fifo = Fifo()
		this.keyStore = jose.JWK.createKeyStore()
		this._keyOptions = {alg: 'RS256', use: 'sig' }
	}
	getKeys() {
		return this.keyStore.all({use:'sig'})
	}
	async genetateKeys() {
		const keys = await this.keyStore.generate('RSA', 2048, this._keyOptions)
		this._fifo.push(JSON.stringify(this.keyStore.toJSON(true))) 
		return this
	}
	createSign(options=null){
		let key 
		if(!options?.kid){
			const [firstKey] = this.getKeys()
			key = firstKey
		}else{
			key = this.keyStore.get(options.kid)
		}
		const signerOptions = { compact: true, jwk: key, fields: { typ: 'jwt' } }
		this.signer = jose.JWS.createSign(signerOptions, key)
		return this.signer
	}
	getJwks(){
		return JSON.parse(this._fifo.last())
	}
}
export const SEVER_KEY = fs.readFileSync('./keys/server-key.pem')
export const SEVER_CRT = fs.readFileSync('./keys/server-crt.pem')
export const AUTH_SIGNER_KEY = fs.readFileSync('./keys/auth-signer-private-key.pem')
export const AUTH_PUB_KEY = fs.readFileSync('./keys/auth-signer-public-key.pem')
export default {
	SEVER_KEY,
	SEVER_CRT,
	AUTH_SIGNER_KEY,
	AUTH_PUB_KEY
}