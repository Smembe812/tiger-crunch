// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
import sinon from "sinon";
import app, {options} from "../../index"
import {suppressLog} from "../preparation"
const https = require('https');
const request = require('supertest')
describe("UserRequests",()=>{
    const server = https.createServer(options, app);
    const testPort="5500"
    before(async()=>{
        suppressLog()
        server.listen(testPort, () => {
            console.log(`Test app listening at https://tiger-crunch.com:${testPort}`)
        })
    })
    after( async () => {
        await server.close()
        sinon.restore()
    });
    describe("as ID bot", async () => {
        describe("POST /users", () => {
            it("can register new user", async () => {
                const response = await request(app)
                    .post("/users")
                    .send({
                        name:"Paul Sembereka", 
                        email:"paulsembereka@zohomail.eu",
                        phone:"12345678",
                        proposedPIN:"1234"
                    })
                const {id, ...actual} = response.body
                expect(response.statusCode).to.be.eql(201) 
                expect(id).to.be.a.string
                expect(actual).to.eql({
                    name:"Paul Sembereka", 
                    email:"paulsembereka@zohomail.eu",
                    phone:"12345678"
                })
            })
            it("can fail", async () => {
                const response = await request(app)
                    .post("/users")
                    .send({
                        name:"Paul Sembereka", 
                        email:"paulsembereka@zohomail.eu",
                        phone:"1234dddddddd56s78",
                        proposedPIN:"1234"
                    })
                const {uuid, ...actual} = response.body
                expect(response.statusCode).to.be.eql(422) 
                expect(actual).to.eql({ error: 'invalid phone number' })
            })
        })
    })
})