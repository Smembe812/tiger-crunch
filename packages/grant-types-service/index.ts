import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
import DataSource from './datasource'
import NonceManager from "./nonce-manager"
import makeAuthorizationCodeFlow from "./authenticate/authorization-code"
import makeTokenGrant from "./authenticate/token"
import makeImplicitFlow from "./authenticate/implicit-flow"
import makeHybridFlow from "./authenticate/hybrid-flow"
import makeRefreshTokenGrant from "./authenticate/refresh-token"
import makeGrantTypes from './grant-types'
const dataSource = new DataSource("level-oauth-grants")
const nonceManager = new NonceManager('implicit-nonce')
const GrantTypes = makeGrantTypes({
    clientUseCases: Client.useCases,
    dataSource,
    util,
    nonceManager,
    Authenticate:{
        makeAuthorizationCodeFlow,
        makeTokenGrant,
        makeImplicitFlow,
        makeHybridFlow,
        makeRefreshTokenGrant
    }
})
export default {
    GrantTypes,
    dataSource,
    nonceManager
}