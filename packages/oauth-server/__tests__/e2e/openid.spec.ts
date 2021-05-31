// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
import app, {options} from "../../index"
import { 
    impRedirectErrorMock, 
    impRedirectErrorText, 
    impRedirectUriMock, 
    impRedirectURITextMock, 
    locationMock, 
    redirectionTextMock, 
    redirectUriMock, 
    redirectURITextMock, 
    signedCookieMock 
} from "../data/openid";
const https = require('https');
const fs = require("fs")
const request = require('supertest')
import GTS from "@smembe812/grant-types-service"
describe("UserRequests",()=>{
    const server = https.createServer(options, app);
    const testPort="5500"
    const CODE = "e035f59aa817b211655a"
    before(async()=>{
        const codeDataSource = GTS.dataSource
        try {
            await codeDataSource.insert({
                code:CODE,
                sub:"8b3692a8-4108-40d8-a6c3-dfccca3dd12c"
            })
        } catch (error) {
            console.log(error)
        }
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
                        expect(contentLength).to.eql('126')
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
                it("can fail with error, on invalid client_id", async (done) => {
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
                it('can fail with error, on invalid domain', async (done) => {
                    const valid_client_id = "8b3692a8-4108-40d8-a6c3-dfccca3dd12c"
                    const invalid_redirect_uri = "https://invalid.example.com"
                    const query = invalid_client_query
                                    .replace("'CLIENTID'", valid_client_id)
                                    .replace("'REDIRECT_URI'", invalid_redirect_uri)
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
    describe("TOKEN flow", async () => {
        describe("POST /auth/token", async () => {
            describe("valid client", async () => {
                const validClientCredentials = {
                    client_id:"fdd885ee-e6fe-4ffa-b679-beb7766c187a",
                    client_key:"Fya8B-GYzW9pbMHCBGT85_yRnsi9DlRBzvQ2R6yKYWs="
                }
                const valid_client_query = `?grant_type=authorization_code&code=${CODE}&client_id=${validClientCredentials.client_id}&client_key=${validClientCredentials.client_key}&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can redeem athorization code through token", async (done) => {
                    request(app)
                        .post(`/auth/token${valid_client_query}`)
                        .end((error, response) => {
                            const headers = response.header
                            const responseBody = response.body
                            const cacheControl = headers['cache-control']
                            const pragma = headers['pragma']
                            const contentLength = headers['content-length']
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody.id_token).to.be.a.string
                            expect(responseBody.access_token).to.be.a.string
                            expect(responseBody.expires_in).to.eql(600)
                            expect(cacheControl).to.eql('no-store')
                            expect(pragma).to.eql('no-cache')
                            expect(contentLength).to.eql('870')
                        })
                    done()
                })
                it("can get error response on invalid request", async (done) => {
                    const invalid_request = valid_client_query.replace("authorization_code", "unsupported_grant")
                    request(app)
                        .post(`/auth/token${invalid_request}`)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody.error).to.eql("invalid_request")
                        })
                    done()
                })
            })
            describe("invalid client", async () => {
                const invalidClientCredentials = {
                    client_id:"fdd885ee-e6fe-4ffa-b679-beb7766c187a",
                    client_key:"LEM6Bm-QLPIr0QUkv5S71tkQ7dDIKxAyWlFpSFRfHnQ="
                }
                const invalid_client_query = `?grant_type=authorization_code&code=e015310f01eafc0eb3fd&client_id=${invalidClientCredentials.client_id}&client_key=${invalidClientCredentials.client_key}&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can get invalid client credentials error", async (done) => {
                    request(app)
                        .post(`/auth/token${invalid_client_query}`)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody).to.be.eql({ error: 'wrong client_id or client_key provided' })
                        })
                    done()
                })
            })
            describe("no client credentals provided", async () => {
                const invalidClientCredentials = {
                    client_id:"",
                    client_key:""
                }
                const invalid_client_query = `?grant_type=authorization_code&code=e015310f01eafc0eb3fd&client_id=${invalidClientCredentials.client_id}&client_key=${invalidClientCredentials.client_key}&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can get invalid client credentials error", async (done) => {
                    request(app)
                        .post(`/auth/token${invalid_client_query}`)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody).to.be.eql({ error: 'client credentials not provided' })
                        })
                    done()
                })
            })
        })
    })
    describe("IMPLICIT flow", () => {
        describe("GET /auth/implicit/", () => {
            describe("on valid client", async () => {
                let valid_client_query;
                beforeEach(async () => {
                    const crypto = require('crypto');
                    let nonce = crypto.randomBytes(16)
                        .toString('base64')
                        .split('+').join("-").split('/').join("_")
                    valid_client_query = `?response_type=id_token%20token&scope=openid%20profile%20email&client_id=8b3692a8-4108-40d8-a6c3-dfccca3dd12c&state=af0ifjsldkj&redirect_uri=https%3A%2F%2Ffindyourcat.com&nonce=${nonce}`
                })
                it("can redirect to login server when user not logged in", async (done) => {
                    request(app)
                        .get(`/auth/implicit${valid_client_query}`)
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
                            expect(contentLength).to.eql('828')
                        })
                    done()
                })
                it("can redirect to client's redirect_uri with token when end user logged in", async (done) => {
                    request(app)
                        .get(`/auth/implicit${valid_client_query}`)
                        .set('Cookie', signedCookieMock)
                        .end((error, response) => {
                            const headers = response.header
                            const location = headers.location
                            const text = response.text
                            const contentLength = headers['content-length']
                            const isLocation = location.includes(impRedirectUriMock)
                            const isRedirectText = text.includes(impRedirectURITextMock)
                            expect(location).to.be.a.string
                            expect(isLocation).to.be.true
                            expect(isRedirectText).to.be.true
                        })
                        done()
                })
                it("redirects with error on nonce replay", async (done) => {
                    const with_invalid_nonce = valid_client_query.split("nonce")[0]+"nonce=n-0S6_WzA2Mj"
                    request(app)
                    .get(`/auth/implicit${with_invalid_nonce}`)
                        .set('Cookie', signedCookieMock)
                        .end((error, response) => {
                            const headers = response.header
                            const location = headers.location
                            const text = response.text
                            console.log(text)
                            const isLocation = location.includes(impRedirectErrorMock)
                            const isRedirectText = text.includes(impRedirectErrorText)
                            expect(location).to.be.a.string
                            expect(isLocation).to.be.true
                            expect(isRedirectText).to.be.true
                        })
                    done()
                })
            })
        })
    })
})