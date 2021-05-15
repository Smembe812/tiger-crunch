import makeClient from "./clients"
import DataSource from "./datasource"
import makeUseCases from "./usecases"
import makeManager from "./client-manager"
const clientManager = makeManager()
const client = makeClient()
const dataSource = new DataSource("clients")
const useCases = makeUseCases({
    clientManager, 
    dataSource,
    clientEntity:client
})
export default {
    client,
    useCases,
    dataSource
}