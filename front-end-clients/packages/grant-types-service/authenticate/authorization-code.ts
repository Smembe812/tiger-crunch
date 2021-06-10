export default function makeAuthorizationCodeFlow({
    ErrorWrapper,
    ClientAuthenticity,
    ResponseType,
    AuthorizationCode,
    GrantResponse
}){
    return function AuthorizationCodeFlow(params){
        this.params = params
        this.isValidClient=false
        this.isValidResponseType=false
        this.code=null
        this.responseType=null
        this.response=null
        this.verify = async function(){
            if(!this.isValidResponseType()){
                throw new ErrorWrapper(
                    "invalid_request", 
                    "invalid response type for code flow"
                )
            }
            try {
                await this.verifyClient()
                return this
            } catch (error) {
                throw error
            }
        }
        this.verifyClient = async function(){
            const client = new ClientAuthenticity(this.params)
            this.isValidClient = await client.verifyByDomain()
            return this
        }
        this.isValidResponseType = function (){
            const responseType = new ResponseType(this.params)
            return this.isValidResponseType = responseType.isAthorizationCode()
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