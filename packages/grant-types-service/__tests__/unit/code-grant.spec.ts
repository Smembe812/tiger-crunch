// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
const fs = require("fs")
const URL = require('url')
import sinon from "sinon";
import makeGrantTypes from "../../index"
import { mockCode, mockInput } from "../data/grant-code";
import Client from "@smembe812/clients-service"
import util from "@smembe812/util"
const clientUseCases = Client.useCases
const grantTypes = makeGrantTypes.GrantTypes({jwt:null, keys:null})
describe("Grant-code",()=>{
    afterEach(function() {
        sinon.restore();
    });
    it("can return redirect_uri with code and state on success", async () => {
        sinon.stub(util, "generateRandomCode").resolves(mockCode)    
        sinon.stub(clientUseCases, "verifyClientByDomain").resolves(true)
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
        sinon.stub(util, "generateRandomCode").resolves(mockCode)    
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