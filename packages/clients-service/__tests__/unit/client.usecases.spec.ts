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
    describe("#registerClient",()=>{
        it("should return valid client with client_key", async ()=> {
            sinon.stub(clientEntity, "create").resolves({
                ...clientWithoutKey,
                key: hashedKey
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
        });
        it("handles exception", async () => {
            sinon.stub(clientEntity, "create").throwsException(new Error("Testing error"))
            sinon.stub(dataSource, "insert").throwsException(new Error("Testing error"))
            sinon.stub(clientManager,"generateSecretKey").throwsException(new Error("Testing error"))
            await expect(
                useCases.registerClient(clientWithoutId)
            ).to.be.rejectedWith("Testing error")
        });
    })
    describe("#verifyClientBySecret",()=>{
        it("returns true on valid client credentials", async ()=> {
            sinon.stub(dataSource, "get").resolves({
                ...clientWithoutKey,
                key: hashedKey
            })
            sinon.stub(clientManager, "validateClientKey").resolves(true)
            const isValidClient = await useCases.verifyClientBySecret({
                client_id: clientMock.id,
                client_key: clientMock.key
            })
            expect(isValidClient).to.true
        });
        it("handles exception", async () => {
            sinon.stub(dataSource, "get").throwsException(new Error("Testing error"))
            sinon.stub(clientManager, "validateClientKey").throws("Testing error")
            await expect(
                useCases.verifyClientBySecret({
                    id: clientMock.id,
                    client_key: clientMock.key
                })
            ).to.be.rejectedWith("Testing error")
        });
    })
    describe("#verifyClientByDomain",()=>{
        it("returns true on valid client credentials", async ()=> {
            sinon.stub(dataSource, "get").resolves({
                ...clientWithoutKey,
                key: hashedKey
            })
            const isValidClient = await useCases.verifyClientByDomain({
                id: clientMock.id,
                domain: clientMock.domain
            })
            expect(isValidClient).to.true
        });
        it("handles exception", async () => {
            sinon.stub(dataSource, "get").throwsException(new Error("Testing error"))
            await expect(
                useCases.verifyClientByDomain({
                    id: clientMock.id,
                    domain: clientMock.domain
                })
            ).to.be.rejectedWith("Testing error")
        });
    })
    describe("#getClient",()=>{
        it("should get client by id", async () => {
            sinon.stub(dataSource, "get").resolves({
                ...clientWithoutKey,
                key: hashedKey
            })
            const client = await useCases.getClient({
                id:clientMock.id
            })
            expect(client).to.be.eql(clientWithoutKey)
        })
        it("handles exception", async () => {
            sinon.stub(dataSource, "get").throwsException(new Error("Testing error"))
            await expect(
                useCases.getClient({id:clientMock.id})
            ).to.be.rejectedWith("Testing error")
        })
    })
    describe("#deleteClient",()=>{
        it("deletes client", async () => {
            sinon.stub(dataSource, "delete").resolves(true)
            const isDeleted = await useCases.deleteClient({
                id:clientMock.id
            })
            expect(isDeleted).to.be.true
        })
        it("handles exception", async () => {
            sinon.stub(dataSource, "delete").throwsException(new Error("Testing error"))
            await expect(
                useCases.deleteClient({id:clientMock.id})
            ).to.be.rejectedWith("Testing error")
        })
    })
});
