// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
const fs = require("fs")
const URL = require('url')
import sinon from "sinon";
import { access_token_mock, code_fake, dataSourceRes, expected_token, id_token_mock, refresh_token_mock, refreshTokenInput, userIdMock, validExpiredTokenPayload} from "../data/refresh-token";
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
const jwt = new util.JWT({
    algo:'RS256', 
    signer:{key:process.env.AUTH_SIGNER_KEY, passphrase:""},
    verifier:process.env.AUTH_PUB_KEY
})
describe("Refresh-grant",()=>{
    let dataSource, grantTypes, nonceManager;
    beforeEach(async () => {
        // not really using the database at all.
        // proper instatiation of datasorce required before tests run
        dataSource = new DataSource("level-oauth-grants")
        nonceManager = new NonceManager('implicit-nonce')
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
        grantTypes = GrantTypes({jwt, keys:null})
    })
    afterEach(async function() {
        sinon.restore();
        await dataSource.close()
        await nonceManager.close()
    });
    it("returns a token response", async () => {
        sinon.stub(util, "verifyCode").resolves(true)
        sinon.stub(util, "generateRandomCode")
            .onFirstCall().resolves({code:refresh_token_mock, c_hash:null})
            .onSecondCall().resolves({code:access_token_mock, c_hash:null})
        sinon.stub(util, "generateAccessToken").resolves({access_token:access_token_mock, refresh_token: refresh_token_mock})
        sinon.stub(Client.useCases, "verifyClientBySecret").resolves(true)
        sinon.stub(jwt, "verify").returns(validExpiredTokenPayload)
        sinon.stub(jwt, "sign").returns(id_token_mock)
        sinon.stub(dataSource, "get").resolves(dataSourceRes)
        const response = await grantTypes.refreshTokenGrant({...refreshTokenInput})
        expect(response).to.be.eql(expected_token)
   })
   it('handles exception', async () => {
    sinon.stub(util, "verifyCode").throwsException(new Error("Testing error"))
    sinon.stub(util, "generateRandomCode")
        .onFirstCall().throwsException(new Error("Testing error"))
        .onSecondCall().throwsException(new Error("Testing error"))
    sinon.stub(Client.useCases, "verifyClientBySecret").throwsException(new Error("Testing error"))
    sinon.stub(jwt, "verify").throwsException(new Error("Testing error"))
    sinon.stub(jwt, "sign").throwsException(new Error("Testing error"))
    sinon.stub(dataSource, "get").throwsException(new Error("Testing error"))
    await expect(
        grantTypes.refreshTokenGrant({...refreshTokenInput})
    ).to.be.rejectedWith("Testing error")
   })
})