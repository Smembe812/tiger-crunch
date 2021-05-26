import makeGrantTypes from './grant-types'
import Client from "@smembe812/clients-service"
import dataSource from './datasource'
const GrantTypes = makeGrantTypes({
    clientUseCases: Client.useCases,
    dataSource
})
export default {
    GrantTypes,
    dataSource
}