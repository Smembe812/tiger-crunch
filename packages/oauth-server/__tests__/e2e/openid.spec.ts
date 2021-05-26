// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
import app, {options} from "../../index"
import { locationMock, redirectionTextMock, redirectUriMock, redirectURITextMock, signedCookieMock } from "../data/openid";
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
    describe("CODE flow", async () => {
        describe("GET /auth/code", async () => {
            describe("on valid client", async () => {
                const valid_client_query = `?response_type=code&scope=openid%20profile%20email&client_id=8b3692a8-4108-40d8-a6c3-dfccca3dd12c&state=af0ifjsldkj&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can redirect to login server when user not logged in", async (done) => {
                    request(app)
                        .get(`/auth/code${valid_client_query}`)
                        .end((error, response) => {
                            const headers = response.header
                            const location = headers.location
                            const text = response.text
                            const contentLength = headers['content-length']
                            const isLocation = location.includes(locationMock)
                            const isRedirectText = text.includes(redirectionTextMock)
                            expect(location).to.be.a.string
                            expect(isLocation).to.be.true
                            expect(isRedirectText).to.be.true
                            expect(contentLength).to.eql('771')
                        })
                        done()
                })
                it("can redirect to client's redirect_uri with code when end user logged in", async (done) => {
                    request(app)
                        .get(`/auth/code${valid_client_query}`)
                        .set('Cookie', signedCookieMock)
                        .end((error, response) => {
                            const headers = response.header
                            const location = headers.location
                            const text = response.text
                            const contentLength = headers['content-length']
                            const isLocation = location.includes(redirectUriMock)
                            const isRedirectText = text.includes(redirectURITextMock)
                            expect(location).to.be.a.string
                            expect(isLocation).to.be.true
                            expect(isRedirectText).to.be.true
                            expect(contentLength).to.eql('102')
                        })
                    done()
                })
                it("can redirect to login when id_token expired")
                it("can fail", async (done) => {
                    request(app)
                        .get(`/auth/code${valid_client_query}`)
                        .end((error, response) => {
                            const headers = response.header
                            const location = headers.location
                            const text = response.text
                            const contentLength = headers['content-length']
                            const isLocation = location.includes(redirectUriMock)
                            const isRedirectText = text.includes(redirectURITextMock)
                            expect(location).to.be.a.string
                            expect(isLocation).to.be.false
                            expect(isRedirectText).to.be.false
                        })
                        done()
                })

            })
            describe("on invalid client", async () => {
                const invalid_client_query = `?response_type=code&scope=openid%20profile%20email&client_id='CLIENTID'&state=af0ifjsldkj&redirect_uri='REDIRECT_URI'`
                it("can fail on invalid client_id", async (done) => {
                    const invalid_client_id = "03dcbb26-f7c9-44a9-a8c0-bdc50d157a65"
                    const valid_redirect_uri = "https://findyourcat.com"
                    const query = invalid_client_query
                                    .replace("'CLIENTID'", invalid_client_id)
                                    .replace("'REDIRECT_URI'", valid_redirect_uri)
                    request(app)
                        .get(`/auth/code${query}`)
                        .set('Cookie', signedCookieMock)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.eql({ error: 'could not verify client' })
                        })
                        done()
                })
            })
        })
    })
})