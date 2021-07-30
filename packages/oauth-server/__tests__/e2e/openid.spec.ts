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
    refreshIdToken,
    signedCookieMock
} from "../data/openid";
const https = require('https');
const fs = require("fs")
const request = require('supertest')
import GTS from "@smembe812/grant-types-service"

const validClientCredentials = {
    client_id:"bd7e5e97-afe4-4796-b757-690ddc79ebb2",
    client_secret:"p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0"
}
async function getToken(){
    const token = await request(app)
    .post(`/auth/token?grant_type=authorization_code&code=5MztzrVaF9hFgBszYbFAXTiv9XpaIEKUWv97Vefeilg=&redirect_uri=https%3A%2F%2Ffindyourcat.com`)
    .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
    console.log(token.body)
    return token.body
}

describe("UserRequests",()=>{
    const server = https.createServer(options, app);
    const testPort="5500"
    const CODE = "e035f59aa817b211655a"
    before(async()=>{
        const codeDataSource = GTS.dataSource
        try {
            await codeDataSource.insert({
                code:CODE,
                sub:"8b3692a8-4108-40d8-a6c3-dfccca3dd12c",
                client_id:"a06293a0-e307-45b2-91b8-7be165f010b7",
                permissions: ["users:admin"]
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
                const valid_client_query = `?response_type=code&scope=openid profile email users:admin&client_id=a06293a0-e307-45b2-91b8-7be165f010b7&state=af0ifjsldkj&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can redirect to login server when user not logged in", () => {
                    request(app)
                        .get(`/auth/code${valid_client_query}`)
                        .end((error, response) => {
                            // console.log(response)
                            const headers = response.header
                            const location = headers.location
                            const text = response.text
                            const contentLength = headers['content-length']
                            const isLocation = location.includes(locationMock)
                            const isRedirectText = text.includes(redirectionTextMock)
                            expect(location).to.be.a.string
                            expect(isLocation).to.be.true
                            expect(isRedirectText).to.be.true
                            // expect(contentLength).to.eql('771')
                        })
                })
                it("can redirect to client's redirect_uri with code when end user logged in", () => {
                    request(app)
                    .get(`/auth/code${valid_client_query}`)
                    .set('Cookie', signedCookieMock)
                    .end((error, response) => {
                        // console.log(response)
                        const headers = response.header
                        const location = headers.location
                        const text = response.text
                        console.log(text, location)
                        const contentLength = headers['content-length']
                        const isLocation = location.includes(redirectUriMock)
                        const isRedirectText = text.includes(redirectURITextMock)
                        expect(location).to.be.a.string
                        expect(isLocation).to.be.true
                        expect(isRedirectText).to.be.true
                        expect(contentLength).to.eql('126')
                    })
                })
                it("can redirect to login when id_token expired")
                it("can fail", () => {
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
                })

            })
            describe("on invalid client", async () => {
                const invalid_client_query = `?response_type=code&scope=openid%20profile%20email&client_id='CLIENTID'&state=af0ifjsldkj&redirect_uri='REDIRECT_URI'`
                it("can fail with error, on invalid client_id", () => {
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
                            expect(responseBody).to.be.eql({ error: "wrong client_id or client_secret provided" })
                        })
                })
                it('can fail with error, on invalid domain', () => {
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
                })
            })
        })
    })
    describe("TOKEN flow", async () => {
        describe("POST /auth/token", async () => {
            describe("valid client", async () => {
                const validClientCredentials = {
                    client_id:"a06293a0-e307-45b2-91b8-7be165f010b7",
                    client_secret:"lUpPp37TjOwzP4VnvIiedWTzqltqrsOdXk011UA15MI="
                }
                const valid_client_query = `?grant_type=authorization_code&code=${CODE}&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can redeem athorization code through token", () => {
                    request(app)
                        .post(`/auth/token${valid_client_query}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                        .end(async (error, response) => {
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
                            expect(contentLength).to.eql('887')
                        })
                })
                it("can get error response on invalid request", () => {
                    const invalid_request = valid_client_query.replace("authorization_code", "unsupported_grant")
                    request(app)
                        .post(`/auth/token${invalid_request}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody.error).to.eql("invalid_request")
                        })
                })
            })
            describe("invalid client", async () => {
                const invalidClientCredentials = {
                    client_id:"a06293a0-e307-45b2-91b8-7be165f010b7",
                    client_secret:"sVAk6XJOfjvOPq45gh6r-errrtJIVegjo1h1JUUSHGw="
                }
                const invalid_client_query = `?grant_type=authorization_code&code=${CODE}&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can get invalid client credentials error", () => {
                    request(app)
                        .post(`/auth/token${invalid_client_query}`)
                        .auth(invalidClientCredentials.client_id, invalidClientCredentials.client_secret)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody).to.be.eql({ error: 'wrong client_id or client_secret provided' })
                        })
                })
            })
            describe("no client credentals provided", async () => {
                const invalidClientCredentials = {
                    client_id:"",
                    client_secret:""
                }
                const invalid_client_query = `?grant_type=authorization_code&code=e015310f01eafc0eb3fd&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can get invalid client credentials error", () => {
                    request(app)
                        .post(`/auth/token${invalid_client_query}`)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody).to.be.eql({ error: 'client credentials not provided' })
                        })
                })
            })
        })
    })
    describe("REFRESH-TOKEN flow", () => {
        describe("POST /auth/refresh-token", () => {
            describe("valid client", async () => {
                const validClientCredentials = {
                    client_id:"bd7e5e97-afe4-4796-b757-690ddc79ebb2",
                    client_secret:"p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0=",
                    refresh_token:"4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA=",
                    id_token:refreshIdToken
                }
                const token = await getToken()
                const valid_client_query = `?grant_type=refresh_token&refresh_token=${token.refresh_token}&scope=openid%20profile`
                it("can refresh token", () => {
                    request(app)
                        .post(`/auth/refresh-token${valid_client_query}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                        .end((error, response) => {
                            const headers = response.header
                            const responseBody = response.body
                            const cacheControl = headers['cache-control']
                            const pragma = headers['pragma']
                            const contentLength = headers['content-length']
                            expect(responseBody.id_token).to.be.a.string
                            expect(responseBody.access_token).to.be.a.string
                            expect(responseBody.expires_in).to.eql(600)
                            expect(cacheControl).to.eql('no-store')
                            expect(pragma).to.eql('no-cache')
                            expect(contentLength).to.be.eql('963')
                            expect(responseBody).to.be.an('object')
                        })
                })
                it("can get error response on invalid request", () => {
                    const invalid_request = valid_client_query.replace("refresh_token", "unsupported_grant")
                    request(app)
                        .post(`/auth/refresh-token${invalid_request}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody.error).to.eql("invalid grant type")
                        })
                })
            })
            describe("invalid client", async () => {
                const invalidClientCredentials = {
                    client_id:"a06293a0-e307-45b2-91b8-7be165f010b7",
                    client_secret:"sVAk6XJOfjvOPq45gh6r-errrtJIVegjo1h1JUUSHGw=",
                    refresh_token:"4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA=",
                    id_token:refreshIdToken
                }
                const token = await getToken()
                const invalid_client_query = `?grant_type=refresh_token&refresh_token=${token.refresh_token}&scope=openid%20profile`
                it("gets invalid client credentials error",  () => {
                    request(app)
                        .post(`/auth/refresh-token${invalid_client_query}`)
                        .auth(invalidClientCredentials.client_id, invalidClientCredentials.client_secret)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody).to.be.eql({ error: 'wrong client_id or client_secret provided' })
                        })
                })
            })
            describe("no client credentals provided", async () => {
                const invalidClientCredentials = {
                    client_id:"",
                    client_secret:"",
                    refresh_token:"4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA=",
                    id_token:refreshIdToken
                }
                const token = await getToken()
                const invalid_client_query = `?grant_type=refresh_token&refresh_token=${token.refresh_token}&scope=openid%20profile`
                it("can get invalid client credentials error", () => {
                    request(app)
                        .post(`/auth/refresh-token${invalid_client_query}`)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody).to.be.eql({ error: 'client credentials not provided' })
                        })
                })
            })
            describe("wrong refresh token", () => {
                const invalidClientCredentials = {
                    client_id:"bd7e5e97-afe4-4796-b757-690ddc79ebb2",
                    client_secret:"p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0=",
                    refresh_token:"p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0=",
                    id_token:refreshIdToken
                }
                const invalid_client_query = `?grant_type=refresh_token&refresh_token=${invalidClientCredentials.refresh_token}&scope=openid%20profile`
                it("can get invalid refresh token error",function() {
                    request(app)
                        .post(`/auth/refresh-token${invalid_client_query}`)
                        .auth(invalidClientCredentials.client_id, invalidClientCredentials.client_secret)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.eql({ error: 'invalid_request' })
                            expect(responseBody).to.be.an('object')
                        })
                })
                describe("client does not own id_token", () => {
                    const validClientCredentials = {
                        client_id:"bd7e5e97-afe4-4796-b757-690ddc79ebb2",
                        client_secret:"p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0=",
                        refresh_token:"4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA=",
                        id_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYzZhZDRmNy1kOWYyLTRkYmUtYjQzZi0zNzEzZjcyMjdkNzgiLCJpc3MiOiJodHRwczovL2F1dGgudGlnZXItY3J1bmNoLmNvbSIsImF1ZCI6ImEwNjI5M2EwLWUzMDctNDViMi05MWI4LTdiZTE2NWYwMTBiNyIsImF1dGhfdGltZSI6MTYyMjY1NzEwNDcyNCwiYXRfaGFzaCI6Im9VM1IyOVo3bkNBdzZvUHlUbXBCNkRBdUVOc05ZeUZnNmZNNnNqTDljZWM9IiwicnRfaGFzaCI6ImQ1T3RiYXBaZVROWnh5aWU1aUpsQ1k5OTRwR1U2bENJNDNibERzQ1hhMlE9IiwiaWF0IjoxNjIyNzA1MjM5LCJleHAiOjE2MjI3MDU4Mzl9.Y06esG-2u2Bld64yOCpb81G7bwaB_NDK3PgBLSYF8woOXHbjEl48Uh7dc8U1ipiKmRlcRSoAPtzzyaH7n718HzM7rtc7VrzmfUORCJB8NxmHOtgJVcpCH5zefu2MXTSIYY5D1LIETnPNdL7xhW0kLJCR4U-W0xPq-WwMSuOcGIXUb7o6O6QMusClVUMcSvrSgpstz6IG4G2thPon3Xhxo86k2qV2AxvVX66lqZcohR72ewoGEYXwewU7IoYoejAJk-L7xbpu34OyMvFrTQWnAapGjDWC1gzmHZHWxDEeWfrQbZ-XvtPb3vmhBJexNY8TOHY13lZiJy5KgfcBsPeHoA"
                    }
                    const valid_client_query = `?grant_type=refresh_token&refresh_token=${validClientCredentials.refresh_token}&scope=openid%20profile`
                    it("returns token error", () => {
                        request(app)
                            .post(`/auth/refresh-token${valid_client_query}`)
                            .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                            .end((error, response) => {
                                const responseBody = response.body
                                expect(responseBody).to.be.an('object'),
                                expect(responseBody.error).to.eql("invalid_request")
                            })
                    })
                })
            })
        })
    })
    describe("IMPLICIT flow", () => {
        describe("GET /auth/implicit/", () => {
            describe("on valid client", () => {
                let valid_client_query;
                beforeEach(async () => {
                    const crypto = require('crypto');
                    let nonce = crypto.randomBytes(16)
                        .toString('base64')
                        .split('+').join("-").split('/').join("_")
                    valid_client_query = `?response_type=id_token%20token&scope=openid%20profile%20email&client_id=8b3692a8-4108-40d8-a6c3-dfccca3dd12c&state=af0ifjsldkj&redirect_uri=https%3A%2F%2Ffindyourcat.com&nonce=${nonce}`
                })
                it("can redirect to login server when user not logged in", () => {
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
                })
                it("can redirect to client's redirect_uri with token when end user logged in", () => {
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

                })
                it("redirects with error on nonce replay", () => {
                    const with_invalid_nonce = valid_client_query.split("nonce")[0]+"nonce=n-0S6_WzA2Mj"
                    request(app)
                    .get(`/auth/implicit${with_invalid_nonce}`)
                        .set('Cookie', signedCookieMock)
                        .end((error, response) => {
                            const headers = response.header
                            const location = headers.location
                            const text = response.text
                            const isLocation = location.includes(impRedirectErrorMock)
                            const isRedirectText = text.includes(impRedirectErrorText)
                            expect(location).to.be.a.string
                            expect(isLocation).to.be.true
                            expect(isRedirectText).to.be.true
                        })
                })
            })
        })
    })
    describe("HYBRID flow", () => {
        describe("GET /auth/hybrid/", () => {
            describe("on valid client", async () => {
                let valid_client_query;
                beforeEach(async () => {
                    const crypto = require('crypto');
                    let nonce = crypto.randomBytes(16)
                        .toString('base64')
                        .split('+').join("-").split('/').join("_")
                    valid_client_query = `?response_type=code id_token&scope=openid%20profile%20email&client_id=8b3692a8-4108-40d8-a6c3-dfccca3dd12c&state=af0ifjsldkj&redirect_uri=https%3A%2F%2Ffindyourcat.com&nonce=${nonce}`
                })
                it("can redirect to login server when user not logged in", () => {
                    request(app)
                        .get(`/auth/hybrid${valid_client_query}`)
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
                            expect(contentLength).to.eql('827')
                        })
                })
                it("can redirect to client's redirect_uri with token when end user logged in", () => {
                    request(app)
                        .get(`/auth/hybrid${valid_client_query}`)
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

                })
                it("redirects with error on nonce replay", () => {
                    const with_invalid_nonce = valid_client_query.split("nonce")[0]+"nonce=n-0S6_WzA2Mj"
                    request(app)
                    .get(`/auth/hybrid${with_invalid_nonce}`)
                        .set('Cookie', signedCookieMock)
                        .end((error, response) => {
                            const headers = response.header
                            const location = headers.location
                            const text = response.text
                            const isLocation = location.includes(impRedirectErrorMock)
                            const isRedirectText = text.includes(impRedirectErrorText)
                            expect(location).to.be.a.string
                            expect(isLocation).to.be.true
                            expect(isRedirectText).to.be.true
                        })
                })
            })
        })
    })
    describe("Introspection flow", () => {
        describe("GET /auth/introspection", () => {
            describe("valid client", () => {
                const validClientCredentials = {
                    client_id:"bd7e5e97-afe4-4796-b757-690ddc79ebb2",
                    client_secret:"p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0=",
                    access_token:"4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA=",
                    id_token:refreshIdToken
                }
                it("can get token info", async () => {
                    const token = await getToken()
                    console.log(token)
                    const valid_client_query = `?token=${token.access_token}&token_hint=access_token`
                    request(app)
                        .post(`/auth/introspection${valid_client_query}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                        .end((error, response) => {
                            console.log(response)
                            const headers = response.header
                            const responseBody = response.body
                            const cacheControl = headers['cache-control']
                            const pragma = headers['pragma']
                            const contentLength = headers['content-length']
                            expect(responseBody.aud).to.be.eql(validClientCredentials.client_id)
                            expect(responseBody.token_type).to.be.eql("Bearer")
                            expect(cacheControl).to.eql('no-store')
                            expect(pragma).to.eql('no-cache')
                            expect(contentLength).to.be.eql('238')
                            expect(responseBody).to.be.an('object')
                        })
                })
                it("invalid token returns active:false", () => {
                    const invalid_request = `?token=${validClientCredentials.client_secret}&token_hint=access_token`
                    request(app)
                        .post(`/auth/introspection${invalid_request}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody).to.eql({active:false})
                        })
                })
                it("invalid token_hint error", () => {
                    const invalid_request = `?token=${validClientCredentials.access_token}&token_hint=invalid`
                    request(app)
                        .post(`/auth/introspection${invalid_request}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                        .end((error, response) => {
                            const responseBody = response.body
                            expect(responseBody).to.be.an('object'),
                            expect(responseBody).to.be.eql({ error: 'invalid token_hint' })
                        })
                })
            })
        })
    })
})