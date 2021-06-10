// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
import app, {options} from "../../index"
const https = require('https');
const fs = require("fs")
const request = require('supertest')
describe("UserRequests",()=>{
    const server = https.createServer(options, app);
    const testPort="5500"
    before(async()=>{
        server.listen(testPort, () => {
            console.log(`Test app listening at https://tiger-crunch.com:${testPort}`)
        })
    })
    after( async () => {
        await server.close()
    });
    describe("as ID bot", async () => {
        describe("POST /users", async () => {
            it("can register new user", () => {
                request(app)
                    .post("/users")
                    .send({
                        name:"Paul Sembereka", 
                        email:"paulsembereka@zohomail.eu",
                        phone:"12345678",
                        proposedPIN:"1234"
                    })
                    .end((error, response) => {
                        const {id, ...actual} = response.body
                        expect(response.statusCode).to.be.eql(201) 
                        expect(id).to.be.a.string
                        expect(actual).to.eql({
                            name:"Paul Sembereka", 
                            email:"paulsembereka@zohomail.eu",
                            phone:"12345678"
                        })
                    })
            })
            it("can fail", () => {
                request(app)
                    .post("/users")
                    .send({
                        name:"Paul Sembereka", 
                        email:"paulsembereka@zohomail.eu",
                        phone:"1234dddddddd56s78",
                        proposedPIN:"1234"
                    })
                    .end((error, response) => {
                        const {uuid, ...actual} = response.body
                        expect(response.statusCode).to.be.eql(422) 
                        expect(actual).to.eql({ error: 'invalid phone number' })
                    })
            })
        })
    })
})