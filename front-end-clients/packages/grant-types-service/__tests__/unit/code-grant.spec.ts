// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
const fs = require("fs")
const URL = require('url')
import sinon from "sinon";
import { mockCode, mockInput } from "../data/grant-code";
import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
const clientUseCases = Client.useCases
import DataSource from "../../datasource"
import NonceManager from "../../nonce-manager"
import makeGrantTypes from '../../grant-types'
import makeAuthorizationCodeFlow from "../../authenticate/authorization-code"
import makeTokenGrant from "../../authenticate/token"
import makeImplicitFlow from "../../authenticate/implicit-flow"
import makeHybridFlow from "../../authenticate/hybrid-flow"
import makeRefreshTokenGrant from "../../authenticate/refresh-token"
import makeIntrospection from "../../authenticate/introspection"
const jwt = new util.JWT({
    algo:'RS256', 
    signer:{key:process.env.AUTH_SIGNER_KEY, passphrase:""},
    verifier:process.env.AUTH_PUB_KEY
})
describe("Grant-code",()=>{
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
    it("can return redirect_uri with code and state on success", async () => {
        sinon.stub(util, "generateRandomCode").resolves({code:mockCode, c_hash:null})    
        sinon.stub(clientUseCases, "verifyClientByDomain").resolves(true)
        sinon.stub(dataSource, "insert").resolves(true)
        const redirectUri = await grantTypes.codeGrant({...mockInput})
        const parseduri = URL.parse(redirectUri)
        const uriHasCode = parseduri.query.includes(`code=${mockCode}`)
        const uriHasState = parseduri.query.includes(`state=${mockInput.state}`)
        expect(redirectUri).to.be.string
        expect(parseduri.protocol).to.be.eql("https:")
        expect(uriHasCode).to.be.true
        expect(uriHasState).to.be.true
   })
   it("can fail with error and error description", async () => {
        sinon.stub(util, "generateRandomCode").resolves({code:mockCode, c_hash:null})    
        sinon.stub(clientUseCases, "verifyClientByDomain").throws(new Error("invalid_request"))
        const redirectUri = await grantTypes.codeGrant({...mockInput})
        const parseduri = URL.parse(redirectUri)
        const uriHasError = parseduri.query.includes(`error=invalid_request`)
        const uriHasErrorDescription = parseduri.query.includes(`error_description=unauthorized_client`)
        expect(redirectUri).to.be.string
        expect(parseduri.protocol).to.be.eql("https:")
        expect(uriHasError).to.be.true
        expect(uriHasErrorDescription).to.be.true
   })
   it("can handle exception", async () => {
        sinon.stub(util, "generateRandomCode").throwsException("Testing error")    
        sinon.stub(clientUseCases, "verifyClientByDomain").throwsException(new Error("Testing error"))
        await expect(
            grantTypes.codeGrant({...mockInput})
        ).to.be.rejectedWith("Testing error")
   })
})