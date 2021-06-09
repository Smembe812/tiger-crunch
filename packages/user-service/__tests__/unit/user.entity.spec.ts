// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
// const should = chai.should
chai.use(chaiAsPromised);
import sinon from "sinon";
import fs from "fs"
import { hash, user as userMock } from "../data/user";
import userEntity from "../../user.entity";
import identityManager from "../../idmanager"
import validators from "@smembe812/util/validators"
describe('UserEntity', function() {
    process.env.AUTH_SIGNER = fs.readFileSync('../../test.pem', "utf8")
    const user = userEntity({identityManager, validators})
    afterEach(function() {
        sinon.restore();
    });
    describe("#email", () => {
        it('should fail if not provided', async () => {
            await expect(
                user({
                    ...userMock,
                    email: null
                })
            ).to.be.rejectedWith("email address not provided")
        });
        it('should fail if invalid', async () => {
            await expect(
                user({
                    ...userMock,
                    email:"notvalid"
                })
            ).to.be.rejectedWith("invalid email address provided")
        });
    })
    describe("#name", () => {
        it('should fail if not provided', async () => {
            await expect(
                user({
                    ...userMock,
                    name:null
                })
            ).to.be.rejectedWith("name of user not provided")
        });
        it('should fail if invalid', async () => {
            await expect(
                user({
                    ...userMock,
                    name:"paul sembereka 123"
                })
            ).to.be.rejectedWith("invalid name provided")
        });
    })
    describe("#phone", () => {
        it('should fail if not provided', async () => {
            await expect(
                user({
                    ...userMock,
                    phone:null,
                })
            ).to.be.rejectedWith("user phone number not provided")
        });
        it('should fail if invalid', async () => {
            await expect(
                user({
                    ...userMock,
                    phone:"qw9093187"
                })
            ).to.be.rejectedWith("invalid phone number")
        });
    })
    describe("#id", () => {
        it('should fail if not provided', async () => {
            await expect(
                user({
                    ...userMock,
                    id:null
                })
            ).to.be.rejectedWith("uuid not provided")
        });
        it('should fail if invalid', async () => {
            await expect(
                user({
                    ...userMock,
                    id:"4a70e47e-ac0c-11eb-8529-0242ac130003"
                })
            ).to.be.rejectedWith("invalid uuid")
        });
    })
    describe("#pin", () => {
        it('should fail if not provided', async () => {
            await expect(
                user({
                    ...userMock,
                    proposedPIN:null
                })
            ).to.be.rejectedWith("pin not provided")
        });
        it('should fail if invalid: alphanumeric', async () => {
            await expect(
                user({
                    ...userMock,
                    proposedPIN:"4a70"
                })
            ).to.be.rejectedWith("pin code must only have digits")
        });
        it('should fail if invalid: not 4 digits long', async () => {
            await expect(
                user({
                    ...userMock,
                    proposedPIN:"407022"
                })
            ).to.be.rejectedWith("pin code must be 4 digits long")
        });
    })
    it("should create valid user object", async ()=> {
        const {proposedPIN, ...userEntityOutPut} = userMock
        const mock = sinon.mock(identityManager)
        mock.expects("computePersistedPIN")
            .once()
            .callsFake(async () => {
                return {hash, salt:"randomsalt", iterations:10000}
            })
        const validUser = await user(userMock)
        expect(validUser).to.eql({
            ...userEntityOutPut,
            pin:{hash, salt:"randomsalt", iterations:10000}
        })
        mock.verify()
    });
    it("handles exeption", async () => {
        const mock = sinon.mock(identityManager)
        mock.expects("computePersistedPIN")
            .once()
            .callsFake(() => {
                throw new Error("Testing Error")
            })
        await expect(
            user(userMock)
        ).to.be.rejectedWith("Testing Error")
        mock.verify()
    });
});
