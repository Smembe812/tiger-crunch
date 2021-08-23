export default function makeIntrospectioon({
	ErrorWrapper,
	ClientAuthenticity,
	jwt,
	tokenCache,
	ErrorScope,
}){
	return function Introspection(params){
		this.params = params
		this.isValidClient=false
		this.response={
			active:false,
			scope:null,
			token_type:'Bearer',
			exp:null,
			iat:null,
			sub:null,
			aud:null,
			iss:null,
			auth_time:null
		}
		this.token={}
		this.verify = async function(){
			await this.verifyClient()
			await this.getToken()
			return this
		}
		this.getToken = async function (){
			if (this.params?.token_hint 
                && (this.params?.token_hint !== 'access_token'
                    && this.params?.token_hint !== 'refresh_token')){
				throw new ErrorWrapper(
					'invalid token_hint',
					`${ErrorScope}.introspection`
				)
			}
			const fields =  await tokenCache.getToken(this.params.token)
			// this.token = tokenCache.get(this.params.token)
			this.token = !fields ? null : {
				id_token: fields?.it || null,
				refresh_token: fields?.rt || null,
				access_token: fields?.at || null
			}
			return this
		}
		this.decodeIdToken = function(){
			if(!this.token){
				this.response.active = false
				return this
			}
			const id_token:string  = this.token.id_token
			const {
				exp,
				iat,
				sub,
				aud,
				iss,
				auth_time
			} = jwt.verify({
				token:id_token,
				options:{ ignoreExpiration: true}
			})
			this.response = {
				...this.response,
				iat,
				sub,
				aud,
				iss,
				auth_time,
				exp
			}
			if (Date.now() >= exp * 1000) {
				this.response.active = false
			}else{
				this.response.active = true
			}
			return this
		}
		this.verifyClient = async function(){
			const client = new ClientAuthenticity(this.params)
			this.isValidClient = await client.verifyBySecret()
			return this
		}
		this.clientOwnsIdToken = function(){
			return this.params.client_id === this.response?.aud
		}
		this.processResponse = function(){
			if(this.token && !this.clientOwnsIdToken()){
				throw new ErrorWrapper(
					'client does not own the id_token',
					`${ErrorScope}.introspection`
				)
			}
			if(!this.response.active){
				this.response = {active: this.response.active}
			}
			return this
		}
		this.getResponse = function (){
			return this.response
		}
	}
}
