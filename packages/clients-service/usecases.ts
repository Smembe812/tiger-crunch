export default function makeUseCases({clientManager, clientEntity, dataSource}){
    function registerClient(params){
        const {project_name, url} = params
        const client = clientEntity.create({project_name, url})
        const newClient = dataSource.insert(client)
        const client_key = clientManager.generateSecretKey()
        return {...newClient, client_key}
    }
    function verifyClient(params){
        const {client_key, id} = params
        const isValid = clientManager.validateClientKey({clienKey:client_key})
        const client = getClient(id)
        return isValid && client
    }
    function getClient(params){
        const {id} = params
        const client = dataSource.get(id)
        return client
    }
    return {
        registerClient,
        verifyClient,
        getClient
    }
}