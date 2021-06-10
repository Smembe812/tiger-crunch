// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
const fs = require("fs")
const URL = require('url')
import sinon from "sinon";
import makeGrantTypes from '../../grant-types'
import { access_token_mock, expected_token, id_token_mock, refresh_token_mock, tokenInputMock, userIdMock} from "../data/token-grant";
import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
import DataSource from "../../datasource"
import NonceManager from "../../nonce-manager"
import makeAuthorizationCodeFlow from "../../authenticate/authorization-code"
import makeTokenGrant from "../../authenticate/token"
import makeImplicitFlow from "../../authenticate/implicit-flow"
import makeHybridFlow from "../../authenticate/hybrid-flow"
import makeRefreshTokenGrant from "../../authenticate/refresh-token"
import makeIntrospection from "../../authenticate/introspection"
import { expectedImpResponse, mockImplicitInput, mockRedirectError, token } from "../data/implicit-flow";
const jwt = new util.JWT({
    algo:'RS256', 
    signer:{key:process.env.AUTH_SIGNER_KEY, passphrase:""},
    verifier:process.env.AUTH_PUB_KEY
})
describe("Implicit-flow",()=>{
    let dataSource, grantTypes, nonceManager, tokenCache;
    beforeEach(async () => {
        // not really using the database at all.
        // proper instatiation of datasorce required before tests run
        dataSource = new DataSource("level-oauth-grants")
        nonceManager = new NonceManager('implicit-nonce')
        tokenCache = null
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
        grantTypes = GrantTypes({jwt, keys:null})
    })
    afterEach(async function() {
        sinon.restore();
        await dataSource.close()
        await nonceManager.close()
    });
    it("returns a token, id_token response_uri", async () => {
        sinon.stub(util, "generateRandomCode")
            .onFirstCall().resolves({code:access_token_mock, c_hash:null})
            .onSecondCall().resolves({code:refresh_token_mock, c_hash:null})
        sinon.stub(util, "generateAccessToken").resolves({access_token:token.access_token})
        sinon.stub(Client.useCases, "verifyClientByDomain").resolves(true)
        sinon.stub(jwt, "sign").returns(id_token_mock)
        sinon.stub(dataSource, "get").resolves(userIdMock)
        sinon.stub(nonceManager, "isAuthenticNonce").resolves(true)
        sinon.stub(nonceManager, "persistNonce").resolves(mockImplicitInput.nonce)
        const response = await grantTypes.implicitFlow({...mockImplicitInput})
        const parseduri = URL.parse(response)
        const uriHasIdToken = parseduri.query.includes(`id_token=${token.id_token}`)
        const uriHasState = parseduri.query.includes(`state=${token.state}`)
        const uriHasAccessToken = parseduri.query.includes(`access_token=${token.access_token}`)
        const uriHasBeaerTokenType = parseduri.query.includes(`token_type=${token.token_type}`)
        expect(response).to.eql(expectedImpResponse)
        expect(uriHasIdToken).to.be.true
        expect(uriHasState).to.be.true
        expect(uriHasAccessToken).to.be.true
        expect(uriHasBeaerTokenType).to.be.true
   })
   it('creates redirect error', async () => {
    sinon.stub(util, "generateRandomCode")
        .onFirstCall().throwsException(new Error("Testing_error"))
        .onSecondCall().throwsException(new Error("Testing_error"))
    sinon.stub(Client.useCases, "verifyClientByDomain").throwsException(new Error("Testing_error"))
    sinon.stub(jwt, "sign").throwsException(new Error("Testing_error"))
    sinon.stub(nonceManager, "isAuthenticNonce").throwsException(new Error("Testing_error"))
    sinon.stub(nonceManager, "persistNonce").throwsException(new Error("Testing_error"))
    sinon.stub(dataSource, "get").throwsException(new Error("Testing_error"))
    const redirectUri = await grantTypes.implicitFlow({...mockImplicitInput})
    expect(
        redirectUri
    ).to.eql(mockRedirectError)
})
//    it('handles exception', async () => {
//         sinon.stub(util, "generateRandomCode")
//             .onFirstCall().throwsException(new Error("Testing error"))
//             .onSecondCall().throwsException(new Error("Testing error"))
//         sinon.stub(Client.useCases, "verifyClientByDomain").throwsException(new Error("Testing error"))
//         sinon.stub(jwt, "sign").throwsException(new Error("Testing error"))
//         sinon.stub(dataSource, "get").throwsException(new Error("Testing error"))
//         await expect(
//             grantTypes.implicitFlow({...mockImplicitInput})
//         ).to.be.rejectedWith("Testing error")
//    })
})