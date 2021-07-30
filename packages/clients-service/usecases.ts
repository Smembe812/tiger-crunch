export default function makeUseCases({clientManager, clientEntity, dataSource, util}){
    async function registerClient(params){
        const {projectName, domain, email} = params
        const client_domain = require('url').parse(domain).host
        const uuid = await util.uuidV4()
        const client_secret_base64 = await clientManager.generateSecretKey()
        const client = await clientEntity.create({
            id:uuid, 
            projectName, 
            domain:client_domain, 
            email, 
            secret:client_secret_base64
        })
        const client_secret_base64_uri = util.toBase64Url(client_secret_base64)
        const client_secret = client_secret_base64_uri
        const {secret, ...newClient} = await dataSource.insert({...client})
        return {...newClient, client_secret}
    }
    async function verifyClientBySecret(params){
        const {client_id, client_secret} = params
        const {secret:secretHash} = await dataSource.get(client_id)
        let isValid;
        try {
            isValid = await clientManager.validateClientSecret({
                clientSecret:client_secret.split('-').join('+').split('_').join('/'),
                salt: secretHash.salt,
                iterations: secretHash.iterations,
                hash: secretHash.hash
            })
            if(!isValid){
                throw new Error("wrong client_id or client_secret provided")
            }
        } catch (error) {
            console.log(error)
            throw error
        }
        return isValid
    }
    async function verifyClientByDomain(params:{id:string, domain:string}):Promise<boolean>{
        const {id, domain} = params
        try {
            const client = await dataSource.get(id)
            if (client.id === id && client.domain === domain){
                return true
            }
            throw new Error("could not verify client")
        } catch (error) {
            throw error
        }
    }
    async function getClient(params){
        const {id} = params
        const {secret, ...client} = await dataSource.get(id)
        return client
    }
    async function deleteClient(params){
        const {id} = params
        const deleted = await dataSource.delete(id)
        return deleted
    }
    return {
        registerClient,
        verifyClientBySecret,
        getClient,
        deleteClient,
        verifyClientByDomain
    }
}