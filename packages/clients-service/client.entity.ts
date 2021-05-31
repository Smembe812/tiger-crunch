function validateClient(client, validators){
    const validations = [
        function validateEmail({email}:{email:string}) : {email:string} {
            if (!email){
                throw new Error("email address not provided")
            }
            if (!validators.isEmail(email)){
                throw new Error("invalid email address provided")
            }
            return {email}
        },
        function validateName({projectName}:{projectName: string}): {projectName:string} {
            if (!projectName){
                throw new Error("project_name not provided")
            }
            return {projectName}
        },
        function validateDomain({domain}:{domain:string}): {domain: string} {
            if(!domain){
                throw new Error("project domain or url not provided")
            }
            if(!validators.isURL(domain)){
                throw new Error("invalid domain or url")
            }
            return {domain}
        },
        function validateUUID({id}:{id:string}):{ id:string } {
            if(!id){
                throw new Error("id not provided")
            }
            if(!validators.isUUID(id)){
                throw new Error("invalid id")
            }
            return {id}
        },
        function validateKey({key}:{key:string}):{ key:string } {
            if(!key){
                throw new Error("key not provided")
            }
            if(!validators.isBase64(key)){
                throw new Error("key must be in base64")
            }
            return {key}
        }
    ]
    const validFields = validations.map(validation => {
        try {
            return validation.call(this,client)
        } catch (error) {
            throw error
        }
    })
    const validUser = Object.assign({},client, ...validFields)
    return Object.freeze(validUser)
}
export default function makeClient({validators, clientManager}){
    return {
        async create({domain, projectName, email, id, key}) : Promise<ClientInput>{
            const params = {domain, projectName, email, id, key}
            try {
                const validatedClient = validateClient(params, validators)
                const persistedKey = await clientManager.computePersistedSecretKey(validatedClient.key)
                return Object.freeze({id, domain,projectName, email, key:persistedKey})
            } catch (error) {
                throw error
            }
        }
    }
}