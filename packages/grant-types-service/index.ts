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
import makePermissionsUseCases from './auth-permissions'
import TokenCache from "./cache-adapter"
import * as kafkaBroker from '@smembe812/kafka-broker'
import makeTransactions from './transactions'
import PermissionsPool from "./permissions-datasource"
// const {
//     Producer,
//     Consumer,
//     publish
// } = kafkaBroker
// const Transactions = makeTransactions({publish})
// const producer = new Producer()
// const consumer = new Consumer()
// consumer.addTopics(["AUTHORIZATION_SERVICE"]).then(() => {
//     consumer.consume(message => {
//         console.log("consumed message",message);
//         Transactions(JSON.parse(message.value));
//     })
// })
const dataSource = new DataSource("level-oauth-grants")
const tokenCache = new TokenCache({maxSize:1000})
const nonceManager = new NonceManager('implicit-nonce')
const permissionsDataSource = new PermissionsPool('level-auth-permissions')
const permissionsUseCases = makePermissionsUseCases({dataSource:permissionsDataSource})
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
    },
    permissionsUseCases
})
export default {
    GrantTypes,
    dataSource,
    nonceManager
}
