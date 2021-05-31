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
import { expectedHyResponse, mockHybridInput, mockRedirectError, token, mockCode } from "../data/hybrid-flow";
const jwt = new util.JWT({
    algo:'RS256', 
    signer:{key:process.env.AUTH_SIGNER_KEY, passphrase:""},
    verifier:process.env.AUTH_PUB_KEY
})
describe("hybrid-flow",()=>{
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
    it("returns a token_id, code response_uri", async () => {
        sinon.stub(Client.useCases, "verifyClientByDomain").resolves(true)
        sinon.stub(util, "generateRandomCode")
            .resolves().resolves({code:mockCode, c_hash:refresh_token_mock})
        sinon.stub(jwt, "sign").returns(id_token_mock)
        sinon.stub(dataSource, "insert").resolves(true)
        sinon.stub(nonceManager, "isAuthenticNonce").resolves(true)
        sinon.stub(nonceManager, "persistNonce").resolves(mockHybridInput.nonce)
        const response = await grantTypes.hybridFlow({...mockHybridInput})
        const parseduri = URL.parse(response)
        const uriHasIdToken = parseduri.query.includes(`id_token=${token.id_token}`)
        const uriHasState = parseduri.query.includes(`state=${token.state}`)
        const uriHasCode = parseduri.query.includes(`code=${mockCode}`)
        expect(response).to.eql(expectedHyResponse)
        expect(uriHasIdToken).to.be.true
        expect(uriHasState).to.be.true
        expect(uriHasCode).to.be.true
   })
   it('creates redirect error', async () => {
    sinon.stub(util, "generateRandomCode")
        .onFirstCall().throwsException(new Error("Testing_error"))
        .onSecondCall().throwsException(new Error("Testing_error"))
    sinon.stub(Client.useCases, "verifyClientByDomain").throwsException(new Error("Testing_error"))
    sinon.stub(jwt, "sign").throwsException(new Error("Testing_error"))
    sinon.stub(dataSource, "get").throwsException(new Error("Testing_error"))
    const redirectUri = await grantTypes.hybridFlow({...mockHybridInput})
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