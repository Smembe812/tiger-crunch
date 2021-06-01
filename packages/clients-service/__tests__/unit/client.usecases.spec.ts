// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
// const should = chai.should
chai.use(chaiAsPromised);
import sinon from "sinon";
import fs from "fs"
import { hash, client as clientMock, clientOutPut, client_key_base64_fake, clientWithoutKey, hashedKey, clientWithoutId } from "../data/client";
import makeClientEntity from "../../client.entity";
import makeUseCases from "../../usecases"
import makeClientManager from "../../client-manager"
import validators from "@smembe812/util/validators"
import DataSource from "../../datasource"
import util from "@smembe812/util"
describe('Client.UseCases', function() {
    const clientManager = makeClientManager()
    const clientEntity = makeClientEntity({clientManager, validators})
    const dataSource = new DataSource("clients")
    const useCases = makeUseCases({util,clientEntity, dataSource, clientManager})
    afterEach(function() {
        sinon.restore();
    });
    describe("#createNewUser",()=>{
        it("should return valid client with client_key", async ()=> {
            const mock = sinon.mock(clientEntity)
            mock.expects("create")
                .once()
                .callsFake(async () => {
                    return {
                        ...clientWithoutKey
                    }
                })
            sinon.stub(dataSource, "insert").resolves({
                ...clientWithoutKey,
                key: hashedKey
            })
            sinon.stub(clientManager,"generateSecretKey").resolves(client_key_base64_fake)
            const validClient = await useCases.registerClient(clientWithoutId)
            expect(validClient).to.eql({
                ...clientOutPut
            })
            mock.verify()
        });
        // it("handles exception", async () => {
        //     const mock = sinon.mock(userEntity)
        //     mock.expects("create")
        //         .once()
        //         .callsFake(() => {
        //             throw new Error("Testing Error")
        //         })
        //     sinon.stub(dataSource, "insert").throws()
        //     sinon.stub(mailManager, "sendMail").throws()
        //     await expect(
        //         userUseCase.createNewUser(userMock)
        //     ).to.be.rejectedWith("Testing Error")
        //     mock.verify()
        // });
    })
    // describe("#verifyUser",()=>{
    //     it("be true on 2fa", async ()=> {
    //         sinon.stub(identityManager, "isValidPin").resolves(true)
    //         sinon.stub(dataSource, "get").resolves({
    //             ...user2fa
    //         })
    //         sinon.stub(otpService, "verify").resolves(true)
    //         const validUser = await userUseCase.verifyUser(userAuthCred)
    //         expect(validUser).to.true
    //     });
    //     it("be true on 1fa", async ()=> {
    //         const {proposedPIN, ...userEntityOutPut} = userMock
    //         sinon.stub(identityManager, "isValidPin").resolves(true)
    //         sinon.stub(dataSource, "get").resolves({
    //             ...userEntityOutPut,
    //             pin:{hash, salt:"randomsalt", iterations:10000}
    //         })
    //         sinon.stub(otpService, "verify").resolves(true)
    //         const validUser = await userUseCase.verifyUser(userAuthCred)
    //         expect(validUser).to.true
    //     });
    //     it("handles exception", async () => {
    //         sinon.stub(dataSource, "get").callsFake(()=>{throw new Error("Testing error")})
    //         sinon.stub(identityManager, "isValidPin").throws("Testing error")
    //         sinon.stub(otpService, "verify").throws("Testing error")
    //         await expect(
    //             userUseCase.verifyUser(userAuthCred)
    //             ).to.be.rejectedWith("Testing error")
    //     });
    // })
    // describe("#verify2faSetup",()=>{
    //     it("should be valid user response object", async ()=> {
    //         const {proposedPIN, ...userEntityOutPut} = userMock
    //         // sinon.stub(identityManager, "isValidPin").resolves(true)
    //         sinon.stub(dataSource, "get").resolves({
    //             ...user2fa
    //         })
    //         sinon.stub(dataSource, "insert").resolves({
    //             ...user2fa
    //         })
    //         sinon.stub(otpService, "verify").resolves(true)
    //         const validUser = await userUseCase.verify2faSetup(
    //             {email:userAuthCred.email},
    //             "123456"
    //         )
    //         expect(validUser).to.be.true
    //     });
    //     it("can fail on invalid pin", async ()=> {
    //         const {proposedPIN, ...userEntityOutPut} = userMock
    //         // sinon.stub(identityManager, "isValidPin").resolves(true)
    //         sinon.stub(dataSource, "get").resolves({
    //             ...userEntityOutPut,
    //             pin:{hash, salt:"randomsalt", iterations:10000}
    //         })
    //         sinon.stub(otpService, "verify").resolves(false)
    //         const validUser = await userUseCase.verifyUser(userAuthCred)
    //         expect(validUser).to.be.false
    //     });
    //     it("handles exception", async () => {
    //         sinon.stub(dataSource, "get").callsFake(()=>{throw new Error("Testing error")})
    //         sinon.stub(dataSource, "insert").callsFake(()=>{throw new Error("Testing error")})
    //         sinon.stub(otpService, "verify").throws("Testing error")
    //         await expect(
    //             userUseCase.verify2faSetup(
    //                 {email:userAuthCred.email},
    //                 "123456")
    //             ).to.be.rejectedWith("Testing error")
    //     });
    // })
    // describe("#setUp2FA",()=>{
    //     it("should be valid user response object", async ()=> {
    //         const {proposedPIN, ...userEntityOutPut} = userMock
    //         sinon.stub(userUseCase, "verifyUser").resolves(true)
    //         sinon.stub(dataSource, "get").resolves({
    //             ...userWithout2fa
    //         })
    //         sinon.stub(dataSource, "insert").resolves({
    //             ...user2fa
    //         })
    //         sinon.stub(otpService, "generateQRCode")
    //             .resolves({secret:"sdsdsfsa", data_url:"dfkljgafskjdhfjl"})
    //         const dataurl = await userUseCase.setUp2FA(
    //             {email:userAuthCred.email, proposedPIN:"1234"}
    //         )
    //         expect(dataurl).to.be.a.string
    //     });
    //     it("can fail on invalid pin", async ()=> {
    //         const {proposedPIN, ...userEntityOutPut} = userMock
    //         sinon.stub(userUseCase, "verifyUser").resolves(false)
    //         sinon.stub(dataSource, "get").resolves({})
    //         const validUser = await userUseCase.verifyUser(userAuthCred)
    //         expect(validUser).to.be.false
    //     });
    //     it("handles exception", async () => {
    //         sinon.stub(dataSource, "get").callsFake(()=>{throw new Error("Testing error")})
    //         sinon.stub(dataSource, "insert").callsFake(()=>{throw new Error("Testing error")})
    //         sinon.stub(userUseCase, "verifyUser").resolves(true)
    //         sinon.stub(otpService, "generateQRCode").throws("Testing error")
    //         await expect(
    //             userUseCase.setUp2FA({email:userAuthCred.email, proposedPIN:"1234"})
    //         ).to.be.rejectedWith("Testing error")
    //     });
    // })
    // describe("#getUser",()=>{
    //     it("should get user by email", async () => {
    //         const {proposedPIN, ...userEntityOutPut} = userMock
    //             sinon.stub(dataSource, "get").resolves({
    //                 ...userWithout2fa
    //             })
    //             const user = await userUseCase.getUser(userEntityOutPut)
    //             expect(user).to.be.eql(userWithout2fa)
    //     })
    //     it("can fail to get user by email", async () => {
    //         const {proposedPIN, ...userEntityOutPut} = userMock
    //             sinon.stub(dataSource, "get").callsFake(()=>{throw new Error("Testing error")})
    //             await expect(
    //                 userUseCase.getUser(userEntityOutPut)
    //             ).to.be.rejectedWith("Testing error")
    //     })
    // }) 
});
