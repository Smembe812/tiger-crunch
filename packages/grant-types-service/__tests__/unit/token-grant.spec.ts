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
import { access_token_mock, code_fake, dataSourceRes, expected_token, id_token_mock, refresh_token_mock, tokenInputMock, userIdMock} from "../data/token-grant";
import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
import DataSource from "../../datasource"
import NonceManager from "../../nonce-manager"
const jwt = new util.JWT({
    algo:'RS256', 
    signer:{key:process.env.AUTH_SIGNER_KEY, passphrase:""},
    verifier:process.env.AUTH_PUB_KEY
})
describe("Token-grant",()=>{
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
    it("returns a token response", async () => {
        sinon.stub(util, "generateRandomCode")
            .onFirstCall().resolves({code:refresh_token_mock, c_hash:null})
            .onSecondCall().resolves({code:access_token_mock, c_hash:null})
        sinon.stub(Client.useCases, "verifyClientBySecret").resolves(true)
        sinon.stub(jwt, "sign").returns(id_token_mock)
        sinon.stub(dataSource, "get").resolves(dataSourceRes)
        const response = await grantTypes.tokenGrant({...tokenInputMock})
        expect(response).to.be.eql(expected_token)
   })
   it('handles exception', async () => {
    sinon.stub(util, "generateRandomCode")
        .onFirstCall().throwsException(new Error("Testing error"))
        .onSecondCall().resolves({code:refresh_token_mock, c_hash:null})
    sinon.stub(Client.useCases, "verifyClientBySecret").resolves(true)
    sinon.stub(jwt, "sign").returns(id_token_mock)
    sinon.stub(dataSource, "get").resolves(dataSourceRes)
    await expect(
        grantTypes.tokenGrant({...tokenInputMock})
    ).to.be.rejectedWith("Testing error")
   })
})