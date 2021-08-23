export default function makeAuthorizationCodeFlow({
	ErrorWrapper,
	ClientAuthenticity,
	ResponseType,
	AuthorizationCode,
	GrantResponse,
	consumer,
	util,
	permissionsUseCases
}){
	return function AuthorizationCodeFlow(handlers, params){
		this.params = params
		this.isValidClient=false
		this.isValidResponseType=false
		this.code=null
		this.responseType=null
		this.response=null
		this.handlePermissions = handlePermissions.bind(this)
		function handlePermissions(handlerParams){
			return permissionsUseCases.getAvailablePermission({
				id: handlerParams.sub,
				permissions: handlerParams.possiblePermissions
			})
				.then(permissions => this.params.permissions = permissions)
		}
		this.handlers = [...Object.values(handlers), this.handlePermissions]
			.map((handler, index) => {
				return (handlerParams) => handler(
					handlerParams, 
					this.handlers[index + 1]
				)
			})
		this.verify = async function(){
			if(!this.isValidResponseType()){
				throw new ErrorWrapper(
					'invalid_request', 
					'invalid response type for code flow'
				)
			}
			this.responseType = this.params.response_type
			await this.verifyClient()
			return this
		}
		this.delegateScope = async function (){
			await this.handlers[0](this.params)
			return this
		}
		this.verifyClient = async function(){
			const client = new ClientAuthenticity(this.params)
			this.isValidClient = await client.verifyByDomain()
			return this
		}
		this.isValidResponseType = function (){
			const responseType = new ResponseType(this.params)
			return responseType.isAthorizationCode()
		}
		this.generateCode = async function(){
			const code = new AuthorizationCode(this.params)
			await code.makeCode()
			await code.persist()
			this.code = code.get()
			return this
		}
		this.processResponse = function(){
			const response = new GrantResponse({code:this.code,...this.params})
			this.response = response.getAuthorizationCodeRedirectUri()
			return this
		}
		this.getResponse = function (){
			return this.response
		}
	}
}