// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
// const should = chai.should
chai.use(chaiAsPromised);
import sinon from "sinon";
import fs from "fs"
import { hash, client as clientMock } from "../data/client";
import clientEntity from "../../client.entity";
import makeClientManager from "../../client-manager"
import validators from "@smembe812/util/validators"
const clientManager = makeClientManager()
describe('clientEntity', function() {
    process.env.AUTH_SIGNER = fs.readFileSync('../../test.pem', "utf8")
    const client = clientEntity({validators, clientManager})
    afterEach(function() {
        sinon.restore();
    });
    describe("#email", () => {
        it('should fail if not provided', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    email: null
                })
            ).to.be.rejectedWith("email address not provided")
        });
        it('should fail if invalid', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    email:"notvalid"
                })
            ).to.be.rejectedWith("invalid email address provided")
        });
    })
    describe("#project_name", () => {
        it('should fail if not provided', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    projectName:null
                })
            ).to.be.rejectedWith("project_name not provided")
        });
    })
    describe("#domain", () => {
        it('should fail if not provided', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    domain:null
                })
            ).to.be.rejectedWith("project domain or url not provided")
        });
        it('should fail if invalid', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    domain:"notvalid"
                })
            ).to.be.rejectedWith("invalid domain or url")
        });
    })
    describe("#id", () => {
        it('should fail if not provided', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    id:null
                })
            ).to.be.rejectedWith("id not provided")
        });
        it('should fail if invalid', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    id:"4a70e47e-ac0c-11eb-8529-0242ac130003"
                })
            ).to.be.rejectedWith("invalid id")
        });
    })
    describe("#key", () => {
        it('should fail if not provided', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    key:null
                })
            ).to.be.rejectedWith("key not provided")
        });
        it('should fail if invalid: not base64', async () => {
            await expect(
                client.create({
                    ...clientMock,
                    key:"40000"
                })
            ).to.be.rejectedWith("key must be in base64")
        });
    })
    it("should create valid user object", async ()=> {
        const {key, ...clientEntityOutPut} = clientMock
        const mock = sinon.mock(clientManager)
        mock.expects("computePersistedSecretKey")
            .once()
            .callsFake(async () => {
                return Promise.resolve({hash, salt:"randomsalt", iterations:10000})
            })
        const validClient = await client.create(clientMock)
        expect(validClient).to.eql({
            ...clientEntityOutPut,
            key:{hash, salt:"randomsalt", iterations:10000}
        })
        mock.verify()
    });
    it("handles exeption", async () => {
        const mock = sinon.mock(clientManager)
        mock.expects("computePersistedSecretKey")
            .once()
            .callsFake(() => {
                throw new Error("Testing Error")
            })
        await expect(
            client.create(clientMock)
        ).to.be.rejectedWith("Testing Error")
        mock.verify()
    });
});
