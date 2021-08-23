export default function makeLogout({
	ErrorWrapper,
	ClientAuthenticity,
	ResponseType,
	GrantResponse,
	jwt,
	dataSource,
	isCodeOwner,
	util,
	tokenCache
}){
	return class Logout{
		params;
		isValidClient;
		isValidResponseType;
		sub;
		responseType;
		response;
		token;
		auth_time;
		sid;
		scope;
		logoutToken;
		jti;
		payload;
		constructor(params){
			this.params = params
			this.isValidClient=false
			this.isValidResponseType=false
			this.sub=null
			this.responseType=null
			this.response=null
			this.logoutToken
			this.auth_time = (+ new Date/1000)
			this.scope=null
			this.jti=null
			this.payload=null
		}
		async logout(){
			this.payload = await tokenCache.logout(this.params.sid)
			return this
		}
		async generateLogoutToken (){
			this.logoutToken = await jwt.sign(
				{
					sub:this.payload.sub,
					iss:this.payload.iss,
					aud: this.payload.aud || null,
					jti:this.payload.jti,
					sid: this.sid,
					events: this.params.events
				},
				{exp: 60*2}
			)
			return this
		}
		getResponse (){
			return this.logoutToken
		}
	}
}