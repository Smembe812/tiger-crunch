import makeGrantTypes from './grant-types'
import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
import dataSource from './datasource'
const GrantTypes = makeGrantTypes({
    clientUseCases: Client.useCases,
    dataSource,
    util
})
export default {
    GrantTypes,
    dataSource
}