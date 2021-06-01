export default function makeUseCases({clientManager, clientEntity, dataSource, util}){
    async function registerClient(params){
        const {v4:uuidv4} = await import("uuid")
        const {projectName, domain, email} = params
        const uuid = uuidv4()
        const client_key_base64 = await clientManager.generateSecretKey()
        const client = await clientEntity.create({id:uuid, projectName, domain, email, key:client_key_base64})
        const client_key_base64_uri = util.toBase64Url(client_key_base64)
        const client_key = client_key_base64_uri
        const {key, ...newClient} = await dataSource.insert({...client})
        return {...newClient, client_key}
    }
    async function verifyClientBySecret(params){
        const {client_key, id} = params
        const {key} = await dataSource.get(id)
        let isValid;
        try {
            isValid = await clientManager.validateClientKey({
                clientKey:client_key.split('-').join('+').split('_').join('/'),
                salt: key.salt,
                iterations: key.iterations,
                hash: key.hash
            })
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
        const {key, ...client} = await dataSource.get(id)
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