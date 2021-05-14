export default function makeUseCases({clientManager, clientEntity, dataSource}){
    async function registerClient(params){
        const {v4:uuidv4} = await import("uuid")
        const {project_name, domain, email} = params
        const uuid = uuidv4()
        const client = clientEntity.create({id:uuid, project_name, domain, email})
        const newClient = await dataSource.insert(client)
        const client_key = clientManager.generateSecretKey().split('+').join('-').split('/').join('_')
        return {...newClient, client_key}
    }
    async function verifyClient(params){
        const {client_key, id} = params
        const isValid = clientManager.validateClientKey({clienKey:client_key})
        const client = getClient(id)
        return isValid && client
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
    return {
        registerClient,
        verifyClient,
        getClient,
        deleteClient
    }
}