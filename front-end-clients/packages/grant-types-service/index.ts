import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
import DataSource from './datasource'
import NonceManager from "./nonce-manager"
import makeAuthorizationCodeFlow from "./authenticate/authorization-code"
import makeTokenGrant from "./authenticate/token"
import makeImplicitFlow from "./authenticate/implicit-flow"
import makeHybridFlow from "./authenticate/hybrid-flow"
import makeRefreshTokenGrant from "./authenticate/refresh-token"
import makeIntrospection from "./authenticate/introspection"
import makeGrantTypes from './grant-types'
import TokenCache from "./cache-adapter"
const dataSource = new DataSource("level-oauth-grants")
const tokenCache = new TokenCache({maxSize:1000})
const nonceManager = new NonceManager('implicit-nonce')
const GrantTypes = makeGrantTypes({
    clientUseCases: Client.useCases,
    dataSource,
    util,
    tokenCache,
    nonceManager,
    Authenticate:{
        makeAuthorizationCodeFlow,
        makeTokenGrant,
        makeImplicitFlow,
        makeHybridFlow,
        makeRefreshTokenGrant,
        makeIntrospection
    }
})
export default {
    GrantTypes,
    dataSource,
    nonceManager
}
