// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
import sinon from "sinon";

describe('grant types flow tests', () => {
    describe("password", () => {})
    describe("athorization_code", () => {})
    describe("refresh_token", () => {})
    it('should pass', () => {
        expect(1).to.eql(1)
    });
    
});
