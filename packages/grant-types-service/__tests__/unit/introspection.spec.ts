// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
const fs = require("fs")
const URL = require('url')
import sinon from "sinon";
import { introspectionInput, expected_introspection_response, validIdTokenPayload, validExpiredIdTokenPayload, expected_introspection_expired_response, wrong_token_id_payload} from "../data/introspection";
import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
import DataSource from "../../datasource"
import NonceManager from "../../nonce-manager"
import makeGrantTypes from '../../grant-types'
import makeAuthorizationCodeFlow from "../../authenticate/authorization-code"
import makeTokenGrant from "../../authenticate/token"
import makeImplicitFlow from "../../authenticate/implicit-flow"
import makeHybridFlow from "../../authenticate/hybrid-flow"
import makeRefreshTokenGrant from "../../authenticate/refresh-token"
import makeIntrospection from "../../authenticate/introspection"
import TokenCache from "../../cache-adapter";
const jwt = new util.JWT({
    algo:'RS256', 
    signer:{key:process.env.AUTH_SIGNER_KEY, passphrase:""},
    verifier:process.env.AUTH_PUB_KEY
})
describe("Introspection",()=>{
    let dataSource, grantTypes, tokenCache, nonceManager;
    beforeEach(async () => {
        // not really using the database at all.
        // proper instatiation of datasorce required before tests run
        dataSource = new DataSource("level-oauth-grants")
        nonceManager = new NonceManager('implicit-nonce')
        tokenCache = new TokenCache({maxSize:1})
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
    it("returns a token info", async () => {
        sinon.stub(Client.useCases, "verifyClientBySecret").resolves(true)
        sinon.stub(tokenCache, "get").returns(true)
        sinon.stub(jwt, "verify").returns(validIdTokenPayload)
        const response = await grantTypes.introspection({...introspectionInput})
        expect(response).to.be.eql(expected_introspection_response)
    })
    it("returns active:false when token expired", async () => {
        sinon.stub(Client.useCases, "verifyClientBySecret").resolves(true)
        sinon.stub(tokenCache, "get").returns(true)
        sinon.stub(jwt, "verify").returns(validExpiredIdTokenPayload)
        const response = await grantTypes.introspection({...introspectionInput})
        expect(response).to.be.eql(expected_introspection_expired_response)
    })
    it("returns active:false when wrong token_id", async () => {
        sinon.stub(Client.useCases, "verifyClientBySecret").resolves(true)
        sinon.stub(tokenCache, "get").returns(true)
        sinon.stub(jwt, "verify").returns(wrong_token_id_payload)
        const response = await grantTypes.introspection({...introspectionInput})
        expect(response).to.be.eql(expected_introspection_expired_response)
    })
    it('handles exception', async () => {
        sinon.stub(Client.useCases, "verifyClientBySecret").throwsException(new Error("Testing error"))
        sinon.stub(tokenCache, "get").throwsException(new Error("Testing error"))
        sinon.stub(jwt, "verify").throwsException(new Error("Testing error"))
        await expect(
            grantTypes.introspection({...introspectionInput})
        ).to.be.rejectedWith("Testing error")
    })
})