// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
// const should = chai.should
chai.use(chaiAsPromised);
import sinon from "sinon";
import fs from "fs"
import { hash, user as userMock, user2fa, userAuthCred, userWithout2fa, userWithoutPPIN } from "../data/user";
import makeUserEntity from "../../user.entity";
import makeUserUseCases from "../../user.use-cases"
import identityManager from "../../idmanager"
import validators from "@tiger-crunch/util/validators"
import DataSource from "../../user.datasource"
import MailManager from '@tiger-crunch/util/mail'
import otpService from "@tiger-crunch/util/otp-service"
describe('UserUseCases', function() {
    const {proposedPIN, ...userEntityOutPut} = userMock
    const mailManager = new MailManager({
        client: process.env.NODEMAILER_OAUTH_CLIENT, 
        service:"noreply@idmanager"
    })
    const userEntity = {create: makeUserEntity({identityManager, validators})}
    const dataSource = new DataSource("users")
    const userUseCase = makeUserUseCases({otpService,userEntity, dataSource, mailManager, identityManager})
    afterEach(function() {
        sinon.restore();
    });
    describe("#createNewUser",()=>{
        it("should create valid user response object", async ()=> {
            const {proposedPIN, ...userEntityOutPut} = userMock
            const mock = sinon.mock(userEntity)
            mock.expects("create")
                .once()
                .callsFake(async () => {
                    return userEntityOutPut
                })
            sinon.stub(dataSource, "insert").resolves({
                ...userEntityOutPut,
                pin:{hash, salt:"randomsalt", iterations:10000}
            })
            sinon.stub(mailManager, "sendMail").resolves(true)
            const validUser = await userUseCase.createNewUser(userMock)
            expect(validUser).to.eql({
                ...userEntityOutPut
            })
            mock.verify()
        });
        it("handles exception", async () => {
            const mock = sinon.mock(userEntity)
            mock.expects("create")
                .once()
                .callsFake(() => {
                    throw new Error("Testing Error")
                })
            sinon.stub(dataSource, "insert").throws()
            sinon.stub(mailManager, "sendMail").throws()
            await expect(
                userUseCase.createNewUser(userMock)
            ).to.be.rejectedWith("Testing Error")
            mock.verify()
        });
    })
    describe("#verifyUser",()=>{
        it("be true on 2fa", async ()=> {
            sinon.stub(identityManager, "isValidPin").resolves(true)
            sinon.stub(dataSource, "get").resolves({
                ...user2fa
            })
            sinon.stub(otpService, "verify").resolves(true)
            const validUser = await userUseCase.verifyUser(userAuthCred)
            expect(validUser).to.true
        });
        it("be true on 1fa", async ()=> {
            const {proposedPIN, ...userEntityOutPut} = userMock
            sinon.stub(identityManager, "isValidPin").resolves(true)
            sinon.stub(dataSource, "get").resolves({
                ...userEntityOutPut,
                pin:{hash, salt:"randomsalt", iterations:10000}
            })
            sinon.stub(otpService, "verify").resolves(true)
            const validUser = await userUseCase.verifyUser(userAuthCred)
            expect(validUser).to.true
        });
        it("handles exception", async () => {
            sinon.stub(dataSource, "get").callsFake(()=>{throw new Error("Testing error")})
            sinon.stub(identityManager, "isValidPin").throws("Testing error")
            sinon.stub(otpService, "verify").throws("Testing error")
            await expect(
                userUseCase.verifyUser(userAuthCred)
                ).to.be.rejectedWith("Testing error")
        });
    })
    describe("#verify2faSetup",()=>{
        it("should be valid user response object", async ()=> {
            const {proposedPIN, ...userEntityOutPut} = userMock
            // sinon.stub(identityManager, "isValidPin").resolves(true)
            sinon.stub(dataSource, "get").resolves({
                ...user2fa
            })
            sinon.stub(dataSource, "insert").resolves({
                ...user2fa
            })
            sinon.stub(otpService, "verify").resolves(true)
            const validUser = await userUseCase.verify2faSetup(
                {email:userAuthCred.email},
                "123456"
            )
            expect(validUser).to.be.true
        });
        it("can fail on invalid pin", async ()=> {
            const {proposedPIN, ...userEntityOutPut} = userMock
            // sinon.stub(identityManager, "isValidPin").resolves(true)
            sinon.stub(dataSource, "get").resolves({
                ...userEntityOutPut,
                pin:{hash, salt:"randomsalt", iterations:10000}
            })
            sinon.stub(otpService, "verify").resolves(false)
            const validUser = await userUseCase.verifyUser(userAuthCred)
            expect(validUser).to.be.false
        });
        it("handles exception", async () => {
            sinon.stub(dataSource, "get").callsFake(()=>{throw new Error("Testing error")})
            sinon.stub(dataSource, "insert").callsFake(()=>{throw new Error("Testing error")})
            sinon.stub(otpService, "verify").throws("Testing error")
            await expect(
                userUseCase.verify2faSetup(
                    {email:userAuthCred.email},
                    "123456")
                ).to.be.rejectedWith("Testing error")
        });
    })
    describe("#setUp2FA",()=>{
        it("should be valid user response object", async ()=> {
            const {proposedPIN, ...userEntityOutPut} = userMock
            sinon.stub(userUseCase, "verifyUser").resolves(true)
            sinon.stub(dataSource, "get").resolves({
                ...userWithout2fa
            })
            sinon.stub(dataSource, "insert").resolves({
                ...user2fa
            })
            sinon.stub(otpService, "generateQRCode")
                .resolves({secret:"sdsdsfsa", data_url:"dfkljgafskjdhfjl"})
            const dataurl = await userUseCase.setUp2FA(
                {email:userAuthCred.email, proposedPIN:"1234"}
            )
            expect(dataurl).to.be.a.string
        });
        it("can fail on invalid pin", async ()=> {
            const {proposedPIN, ...userEntityOutPut} = userMock
            sinon.stub(userUseCase, "verifyUser").resolves(false)
            sinon.stub(dataSource, "get").resolves({})
            const validUser = await userUseCase.verifyUser(userAuthCred)
            expect(validUser).to.be.false
        });
        it("handles exception", async () => {
            sinon.stub(dataSource, "get").callsFake(()=>{throw new Error("Testing error")})
            sinon.stub(dataSource, "insert").callsFake(()=>{throw new Error("Testing error")})
            sinon.stub(userUseCase, "verifyUser").resolves(true)
            sinon.stub(otpService, "generateQRCode").throws("Testing error")
            await expect(
                userUseCase.setUp2FA({email:userAuthCred.email, proposedPIN:"1234"})
            ).to.be.rejectedWith("Testing error")
        });
    })
});
