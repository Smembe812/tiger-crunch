// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
const fs = require("fs")
const URL = require('url')
import sinon from "sinon";
import makeGrantTypes from "../../grant-types"
import { access_token_mock, expected_token, id_token_mock, refresh_token_mock, tokenInputMock, userIdMock} from "../data/token-grant";
import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
import DataSource from "../../datasource"
import NonceManager from "../../nonce-manager"
import { expectedImpResponse, mockImplicitInput, token } from "../data/implicit-flow";
const jwt = new util.JWT({
    algo:'RS256', 
    signer:{key:process.env.AUTH_SIGNER_KEY, passphrase:""},
    verifier:process.env.AUTH_PUB_KEY
})
describe("Implicit-flow",()=>{
    let dataSource, GrantTypes, grantTypes, nonceManager;
    beforeEach(async () => {
        // not really using the database at all.
        // proper instatiation of datasorce required before tests run
        dataSource = new DataSource("level-oauth-grants")
        nonceManager = new NonceManager('implicit-nonce')
        GrantTypes = makeGrantTypes({
            clientUseCases: Client.useCases,
            dataSource,
            util,
            nonceManager
        })
        grantTypes = GrantTypes({jwt, keys:null})
    })
    afterEach(async function() {
        sinon.restore();
        await dataSource.close()
        await nonceManager.close()
    });
    it("can returns a token response_uri", async () => {
        sinon.stub(util, "generateRandomCode")
            .onFirstCall().resolves(access_token_mock)
            .onSecondCall().resolves(refresh_token_mock)
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
   it('handles exception', async () => {
    sinon.stub(util, "generateRandomCode")
        .onFirstCall().throwsException(new Error("Testing error"))
        .onSecondCall().resolves(refresh_token_mock)
    sinon.stub(Client.useCases, "verifyClientByDomain").resolves(true)
    sinon.stub(jwt, "sign").returns(id_token_mock)
    sinon.stub(dataSource, "get").resolves(userIdMock)
    await expect(
        grantTypes.implicitFlow({...mockImplicitInput})
    ).to.be.rejectedWith("Testing error")
   })
})