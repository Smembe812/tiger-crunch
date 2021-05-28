import makeGrantTypes from './grant-types'
import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
import DataSource from './datasource'
import NonceManager from "./nonce-manager"
const dataSource = new DataSource("level-oauth-grants")
const nonceManager = new NonceManager('implicit-nonce')
const GrantTypes = makeGrantTypes({
    clientUseCases: Client.useCases,
    dataSource,
    util,
    nonceManager
})
export default {
    GrantTypes,
    dataSource
}