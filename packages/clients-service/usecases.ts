export default function makeUseCases({clientManager, clientEntity, dataSource}){
    async function registerClient(params){
        const {v4:uuidv4} = await import("uuid")
        const {project_name, domain, email} = params
        const uuid = uuidv4()
        const client = clientEntity.create({id:uuid, project_name, domain, email})
        const random = await generateRandomCode()
        const client_key_base64 = await clientManager.generateSecretKey(random)
        const client_key_base64_uri = client_key_base64.split('+').join('-').split('/').join('_')
        const client_key = client_key_base64_uri
        const secret = await clientManager.computePersistedSecretKey(client_key_base64)
        const {secret:cs, ...newClient} = await dataSource.insert({...client, secret})
        return {...newClient, client_key}
    }
    async function verifyClientBySecret(params){
        const {client_key, id} = params
        const {secret} = await dataSource.get(id)
        let isValid;
        try {
            isValid = await clientManager.validateClientKey({
                clientKey:client_key.split('-').join('+').split('_').join('/'),
                salt: secret.salt,
                iterations: secret.iterations,
                hash: secret.hash
            })
        } catch (error) {
            console.log(error)
            throw error
        }
        return isValid
    }
    async function verifyClientByDomain(params:{id:string, origin:string}):Promise<boolean>{
        const {id, origin} = params
        try {
            const client = await dataSource.get(id)
            return (client.id === id && client.domain === origin)
        } catch (error) {
            throw new Error("could not verify client")
        }
    }
    async function getClient(params){
        const {id} = params
        const client = await dataSource.get(id)
        return client
    }
    async function deleteClient(params){
        const {id} = params
        const deleted = await dataSource.delete(id)
        return deleted
    }
    async function generateRandomCode():Promise<string>{
        const {randomFill} = await import('crypto');
        return new Promise((resolve, reject) => {
            const buf = Buffer.alloc(10);
            randomFill(buf, (err, buf) => {
            if (err) throw err;
                resolve(buf.toString('hex'))
            });
        })
    }
    return {
        registerClient,
        verifyClientBySecret,
        getClient,
        deleteClient,
        verifyClientByDomain
    }
}