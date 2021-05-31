import makeClient from "./client.entity"
import DataSource from "./datasource"
import makeUseCases from "./usecases"
import makeManager from "./client-manager"
import validators from "@smembe812/util/lib/validators"
const clientManager = makeManager()
const client = makeClient({clientManager, validators})
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