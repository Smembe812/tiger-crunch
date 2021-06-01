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
});
