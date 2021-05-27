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
const jwt = new util.JWT({
    algo:'RS256', 
    signer:{key:process.env.AUTH_SIGNER_KEY, passphrase:""},
    verifier:process.env.AUTH_PUB_KEY
})
describe("Token-grant",()=>{
    let dataSource, GrantTypes, grantTypes;
    beforeEach(async () => {
        // not really using the database at all.
        // proper instatiation of datasorce required before tests run
        dataSource = new DataSource("level-oauth-grants")
        GrantTypes = makeGrantTypes({
            clientUseCases: Client.useCases,
            dataSource,
            util
        })
        grantTypes = GrantTypes({jwt, keys:null})
    })
    afterEach(async function() {
        sinon.restore();
        await dataSource.close()
    });
    it("can returns a token response", async () => {
        sinon.stub(util, "generateRandomCode")
            .onFirstCall().resolves(access_token_mock)
            .onSecondCall().resolves(refresh_token_mock)
        sinon.stub(Client.useCases, "verifyClientBySecret").resolves(true)
        sinon.stub(jwt, "sign").returns(id_token_mock)
        sinon.stub(dataSource, "get").resolves(userIdMock)
        const response = await grantTypes.tokenGrant({...tokenInputMock})
        expect(response).to.be.eql(expected_token)
   })
})