// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require("chai");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);
import {suppressLog} from "../preparation"
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
    userInput,
    clientInput
} from "../data/openid";
const https = require('https');
const fs = require("fs")
const request = require('supertest')
import GTS from "@smembe812/grant-types-service"
import User from '@smembe812/user-service'
import sinon from "sinon";
// const grantTypes = makeGrantTypes.GrantTypes({jwt, keys})
const userUseCases = User.userUseCases
const codeDataSource = GTS.dataSource
// const userDataSource = User.                                                                                                                                               

//create user
async function createUser(){
    const response = await request(app)
        .post("/users")
        .send(userInput)
    return response.body
}
//create client
async function createClient(){
    const response = await request(app)
    .post("/clients")
    .send(clientInput)
    return response.body 
}
//authenticate user
async function autheticateUser({email, proposedPIN, otp}){
    const claims = {
        email,
        proposedPIN,
        otp
    }
    const response = await request(app)
    .post("/auth")
    .send({claims})
    return response.headers['set-cookie'][0].split(';')[0]
}
const CODE = "5MztzrVaF9hFgBszYbFAXTiv9XpaIEKUWv97Vefeilg="
async function getToken(vs=null){
    const token = await request(app)
        .post(`/auth/token?grant_type=authorization_code&code=${CODE}&redirect_uri=https://${vs.domain}`)
        .auth(vs.client_id, vs.client_secret)
        .send()
    return token.body
}
class Credentials {
    client_id;
    client_secret;
    domain;
    constructor ({client_id=null, client_secret=null, domain=null}){
        if(client_id && client_secret && domain) this.setCredentials({
            client_id, 
            client_secret,
            domain
        });
    }
    setCredentials({client_id, client_secret, domain}){
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.domain=domain;
        return this;
    }
    getCredentials(){
        return {
            client_id:this.client_id,
            client_secret:this.client_secret,
            domain:this.domain
        }
    }
}
const validClientCredentials = new Credentials({})
describe("UserRequests", () => {
    const server = https.createServer(options, app);
    const testPort="5500"
    let signedCookie;
    before(async()=>{
        suppressLog()
        server.listen(testPort, async() => {
            app.emit('listening', null)
            console.log(`Test app listening at https://tiger-crunch.com:${testPort}`)
        })
            const user = await createUser()
            const client = await createClient()
            signedCookie = await autheticateUser({
                email:user.email, 
                proposedPIN: '1234',
                otp: '603393'
            })
            validClientCredentials.setCredentials({
                client_id:client.id,
                client_secret:client.client_secret,
                domain: client.domain
            })
            try {
                await codeDataSource.insert({
                    code:CODE,
                    sub: user.id,
                    client_id: client.id,
                    permissions: ["users:admin"]
                })
            } catch (error) {
                console.log(error)
            }
    })
    after( async () => {
        await server.close()
        sinon.restore()
    });
    describe("CODE flow", () => {
        describe("GET /auth/code", () => {
            describe("on valid client", () => {
                let valid_client_query;
                beforeEach(async () => {
                    const vcc = validClientCredentials.getCredentials()
                    valid_client_query = `?response_type=code&scope=openid profile email users:admin&client_id=${vcc.client_id}&state=af0ifjsldkj&redirect_uri=https://${vcc.domain}`
                })
                it("can redirect to login server when user not logged in", async () => {
                    const response = await request(app)
                        .get(`/auth/code${valid_client_query}`)
                    // console.log(validClientCredentials,response)
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
                it("can redirect to client's redirect_uri with code when end user logged in", async () => {
                    const response = await request(app)
                        .get(`/auth/code${valid_client_query}`)
                        .set('Cookie', signedCookie)
                    // console.log(response)
                    const headers = response.header
                    const location = headers.location
                    const text = response.text
                    // console.log(text, location)
                    const contentLength = headers['content-length']
                    const isLocation = location.includes(redirectUriMock)
                    const isRedirectText = text.includes(redirectURITextMock)
                    expect(location).to.be.a.string
                    expect(isLocation).to.be.true
                    expect(isRedirectText).to.be.true
                    // expect(contentLength).to.eql('126')
                })
                it("can redirect to login when id_token expired")
                it("can fail", async () => {
                    const response = await request(app)
                        .get(`/auth/code${valid_client_query}`)
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
            describe("on invalid client", () => {
                const invalid_client_query = `?response_type=code&scope=openid%20profile%20email&client_id='CLIENTID'&state=af0ifjsldkj&redirect_uri='REDIRECT_URI'`
                it("can fail with error, on invalid client_id", async () => {
                    const invalid_client_id = "03dcbb26-f7c9-44a9-a8c0-bdc50d157a65"
                    const valid_redirect_uri = "https://findyourcat.com"
                    const query = invalid_client_query
                        .replace("'CLIENTID'", invalid_client_id)
                        .replace("'REDIRECT_URI'", valid_redirect_uri)
                    // console.log(signedCookie)
                    const res = await request(app)
                        .get(`/auth/code${query}`)
                        .set('Cookie', signedCookie)
                    const responseBody = res.body
                    // console.log(responseBody)
                    expect(responseBody).to.be.eql({ error: "wrong client_id or client_secret provided" })
                })
                it('can fail with error, on invalid domain', async () => {
                    const valid_client_id = "8b3692a8-4108-40d8-a6c3-dfccca3dd12c"
                    const invalid_redirect_uri = "https://invalid.example.com"
                    const query = invalid_client_query
                        .replace("'CLIENTID'", valid_client_id)
                        .replace("'REDIRECT_URI'", invalid_redirect_uri)
                    const response =  await request(app)
                        .get(`/auth/code${query}`)
                        .set('Cookie', signedCookie)
                    const responseBody = response.body
                    expect(responseBody).to.be.eql({ error: 'could not verify client' })
                })
            })
        })
    })
    describe("TOKEN flow", async () => {
        describe("POST /auth/token", async () => {
            describe("valid client", async () => {
                // const validClientCredentials = {
                //     client_id: client.id,
                //     client_secret: client.client_secret
                //     // client_id:"a06293a0-e307-45b2-91b8-7be165f010b7",
                //     // client_secret:"lUpPp37TjOwzP4VnvIiedWTzqltqrsOdXk011UA15MI="
                // }
                let valid_client_query;
                beforeEach(async () => {
                    const vcc = validClientCredentials.getCredentials()
                    // await codeDataSource.insert({
                    //     code:CODE,
                    //     sub: user.id,
                    //     client_id: client.id,
                    //     permissions: ["users:admin"]
                    // })
                    valid_client_query = `?grant_type=authorization_code&code=${CODE}&redirect_uri=https://${vcc.domain}`

                })
                it("can redeem athorization code through token", async() => {
                    const response = await request(app)
                        .post(`/auth/token${valid_client_query}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                    const headers = response.header
                    const responseBody = response.body
                    const cacheControl = headers['cache-control']
                    const pragma = headers['pragma']
                    const contentLength = headers['content-length']
                    expect(responseBody).to.be.an('object')
                    expect(responseBody.id_token).to.be.a.string
                    expect(responseBody.access_token).to.be.a.string
                    expect(responseBody.expires_in).to.eql(600)
                    expect(cacheControl).to.eql('no-store')
                    expect(pragma).to.eql('no-cache')
                    // expect(contentLength).to.eql('887')
                })
                it("can get error response on invalid request", async () => {
                    const invalid_request = valid_client_query.replace("authorization_code", "unsupported_grant")
                    const response = await request(app)
                        .post(`/auth/token${invalid_request}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                    const responseBody = response.body
                    expect(responseBody).to.be.an('object')
                    expect(responseBody.error).to.eql("invalid_request")
                })
            })
            describe("invalid client", () => {
                const invalidClientCredentials = {
                    client_id:"a06293a0-e307-45b2-91b8-7be165f010b7",
                    client_secret:"sVAk6XJOfjvOPq45gh6r-errrtJIVegjo1h1JUUSHGw="
                }
                const invalid_client_query = `?grant_type=authorization_code&code=${CODE}&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can get invalid client credentials error", async () => {
                    const response = await request(app)
                        .post(`/auth/token${invalid_client_query}`)
                        .auth(invalidClientCredentials.client_id, invalidClientCredentials.client_secret)
                    const responseBody = response.body
                    expect(responseBody).to.be.an('object')
                    expect(responseBody).to.be.eql({ error: 'wrong client_id or client_secret provided' })
                })
            })
            describe("no client credentals provided", () => {
                const invalidClientCredentials = {
                    client_id:"",
                    client_secret:""
                }
                const invalid_client_query = `?grant_type=authorization_code&code=e015310f01eafc0eb3fd&redirect_uri=https%3A%2F%2Ffindyourcat.com`
                it("can get invalid client credentials error", async () => {
                    const response = await request(app)
                        .post(`/auth/token${invalid_client_query}`)
                    const responseBody = response.body
                    expect(responseBody).to.be.an('object')
                    expect(responseBody).to.be.eql({ error: 'client credentials not provided' })
                })
            })
        })
    })
    describe("REFRESH-TOKEN flow", () => {
        describe("POST /auth/refresh-token", () => {
            describe("valid client", async () => {
                let valid_client_query, vcc, token;
                beforeEach(async()=>{
                    vcc = validClientCredentials.getCredentials()
                    token = await getToken(vcc)
                    valid_client_query = `?grant_type=refresh_token&refresh_token=${token.refresh_token}&scope=openid%20profile`

                })
                const vs = {
                    // client_id:"bd7e5e97-afe4-4796-b757-690ddc79ebb2",
                    // client_secret:"p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0=",
                    refresh_token:"4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA=",
                    id_token:refreshIdToken
                }
                it("can refresh token", async () => {
                    const response = await request(app)
                        .post(`/auth/refresh-token${valid_client_query}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
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
                    // expect(contentLength).to.be.eql('963')
                    expect(responseBody).to.be.an('object')
                })
                it("can get error response on invalid request", async () => {
                    const invalid_request = valid_client_query.replace("refresh_token", "unsupported_grant")
                    const response = await request(app)
                        .post(`/auth/refresh-token${invalid_request}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                    const responseBody = response.body
                    expect(responseBody).to.be.an('object')
                    expect(responseBody.error).to.eql("invalid_request")
                })
            })
            describe("invalid client", async () => {
                const invalidClientCredentials = {
                    client_id:"a06293a0-e307-45b2-91b8-7be165f010b7",
                    client_secret:"sVAk6XJOfjvOPq45gh6r-errrtJIVegjo1h1JUUSHGw=",
                    refresh_token:"4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA=",
                    id_token:refreshIdToken
                }
                const token = await getToken(validClientCredentials.getCredentials())
                const invalid_client_query = `?grant_type=refresh_token&refresh_token=${token.refresh_token}&scope=openid%20profile`
                it("gets invalid client credentials error",  async () => {
                    const response = await request(app)
                        .post(`/auth/refresh-token${invalid_client_query}`)
                        .auth(invalidClientCredentials.client_id, invalidClientCredentials.client_secret)
                    const responseBody = response.body
                    expect(responseBody).to.be.an('object')
                    expect(responseBody).to.be.eql({ 
                        error: 'wrong client_id or client_secret provided' 
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
                const token = await getToken(validClientCredentials.getCredentials())
                const invalid_client_query = `?grant_type=refresh_token&refresh_token=${token.refresh_token}&scope=openid%20profile`
                it("can get invalid client credentials error", async () => {
                    const response = await request(app)
                        .post(`/auth/refresh-token${invalid_client_query}`)
                    const responseBody = response.body
                    expect(responseBody).to.be.an('object')
                    expect(responseBody).to.be.eql({ error: 'client credentials not provided' })
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
                it("can get invalid refresh token error", async function() {
                    const response = await request(app)
                        .post(`/auth/refresh-token${invalid_client_query}`)
                        .auth(invalidClientCredentials.client_id, invalidClientCredentials.client_secret)
                    const responseBody = response.body
                    expect(responseBody).to.be.eql({ error: 'invalid_request' })
                    expect(responseBody).to.be.an('object')
                })
                describe("client does not own id_token", () => {
                    const validClientCredentials = {
                        client_id:"bd7e5e97-afe4-4796-b757-690ddc79ebb2",
                        client_secret:"p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0=",
                        refresh_token:"4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA=",
                        id_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYzZhZDRmNy1kOWYyLTRkYmUtYjQzZi0zNzEzZjcyMjdkNzgiLCJpc3MiOiJodHRwczovL2F1dGgudGlnZXItY3J1bmNoLmNvbSIsImF1ZCI6ImEwNjI5M2EwLWUzMDctNDViMi05MWI4LTdiZTE2NWYwMTBiNyIsImF1dGhfdGltZSI6MTYyMjY1NzEwNDcyNCwiYXRfaGFzaCI6Im9VM1IyOVo3bkNBdzZvUHlUbXBCNkRBdUVOc05ZeUZnNmZNNnNqTDljZWM9IiwicnRfaGFzaCI6ImQ1T3RiYXBaZVROWnh5aWU1aUpsQ1k5OTRwR1U2bENJNDNibERzQ1hhMlE9IiwiaWF0IjoxNjIyNzA1MjM5LCJleHAiOjE2MjI3MDU4Mzl9.Y06esG-2u2Bld64yOCpb81G7bwaB_NDK3PgBLSYF8woOXHbjEl48Uh7dc8U1ipiKmRlcRSoAPtzzyaH7n718HzM7rtc7VrzmfUORCJB8NxmHOtgJVcpCH5zefu2MXTSIYY5D1LIETnPNdL7xhW0kLJCR4U-W0xPq-WwMSuOcGIXUb7o6O6QMusClVUMcSvrSgpstz6IG4G2thPon3Xhxo86k2qV2AxvVX66lqZcohR72ewoGEYXwewU7IoYoejAJk-L7xbpu34OyMvFrTQWnAapGjDWC1gzmHZHWxDEeWfrQbZ-XvtPb3vmhBJexNY8TOHY13lZiJy5KgfcBsPeHoA"
                    }
                    const valid_client_query = `?grant_type=refresh_token&refresh_token=${validClientCredentials.refresh_token}&scope=openid%20profile`
                    it("returns token error", async () => {
                        const response = await request(app)
                            .post(`/auth/refresh-token${valid_client_query}`)
                            .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                        const responseBody = response.body
                        expect(responseBody).to.be.an('object')
                        expect(responseBody.error).to.eql("invalid_request")
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
                    const vcc = validClientCredentials.getCredentials()
                    const crypto = require('crypto');
                    let nonce = crypto.randomBytes(16)
                        .toString('base64')
                        .split('+').join("-").split('/').join("_")
                    valid_client_query = `?response_type=id_token%20token&scope=openid%20profile%20email&client_id=${vcc.client_id}&state=af0ifjsldkj&redirect_uri=https://${vcc.domain}&nonce=${nonce}`
                })
                it("can redirect to login server when user not logged in", async () => {
                    const response = await request(app)
                        .get(`/auth/implicit${valid_client_query}`)
                    const headers = response.header
                    const location = headers.location
                    const text = response.text
                    const contentLength = headers['content-length']
                    const isLocation = location.includes(locationMock)
                    const isRedirectText = text.includes(redirectionTextMock)
                    expect(location).to.be.a.string
                    expect(isLocation).to.be.true
                    expect(isRedirectText).to.be.true
                    // expect(contentLength).to.eql('862')
                })
                it("can redirect to client's redirect_uri with token when end user logged in", async () => {
                    const response = await request(app)
                        .get(`/auth/implicit${valid_client_query}`)
                        .set('Cookie', signedCookie)
                        .send()
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
                it("redirects with error on nonce replay", async () => {
                    const with_invalid_nonce = valid_client_query.split("nonce")[0]+"nonce=n-0S6_WzA2Mj"
                    const response = await request(app)
                        .get(`/auth/implicit${with_invalid_nonce}`)
                        .set('Cookie', signedCookie)
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
    describe("HYBRID flow", () => {
        describe("GET /auth/hybrid/", () => {
            describe("on valid client", () => {
                let valid_client_query;
                beforeEach(async () => {
                    const vcc = validClientCredentials.getCredentials()
                    const crypto = require('crypto');
                    let nonce = crypto.randomBytes(16)
                        .toString('base64')
                        .split('+').join("-").split('/').join("_")
                    valid_client_query = `?response_type=code id_token&scope=openid%20profile%20email&client_id=${vcc.client_id}&state=af0ifjsldkj&redirect_uri=https://${vcc.domain}&nonce=${nonce}`
                })
                it("can redirect to login server when user not logged in", async () => {
                    const response = await request(app)
                        .get(`/auth/hybrid${valid_client_query}`)
                        .send()
                    const headers = response.header
                    const location = headers.location
                    const text = response.text
                    const isLocation = location.includes(locationMock)
                    const isRedirectText = text.includes(redirectionTextMock)
                    expect(location).to.be.a.string
                    expect(isLocation).to.be.true
                    expect(isRedirectText).to.be.true
                })
                it("can redirect to client's redirect_uri with token when end user logged in", async () => {
                    const response = await request(app)
                        .get(`/auth/hybrid${valid_client_query}`)
                        .set('Cookie', signedCookie)
                        .send()
                    const headers = response.header
                    const location = headers.location
                    const text = response.text
                    const isLocation = location.includes(impRedirectUriMock)
                    const isRedirectText = text.includes(impRedirectURITextMock)
                    expect(location).to.be.a.string
                    expect(isLocation).to.be.true
                    expect(isRedirectText).to.be.true
                })
                it("redirects with error on nonce replay", async () => {
                    const with_invalid_nonce = valid_client_query.split("nonce")[0]+"nonce=n-0S6_WzA2Mj"
                    const response = await request(app)
                        .get(`/auth/hybrid${with_invalid_nonce}`)
                        .set('Cookie', signedCookie)
                        .send()
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
    describe("Introspection flow", () => {
        describe("GET /auth/introspection", () => {
            describe("valid client", () => {
                const access_token="4Zr0T0pDeMmz8w9RYRPKtEyYjG6nhOOeipXfMvOssNA="
                it("can get token info", async () => {
                    const token = await getToken(validClientCredentials.getCredentials())
                    const valid_client_query = `?token=${token.access_token}&token_hint=access_token`
                    const response = await request(app)
                        .post(`/auth/introspection${valid_client_query}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                    // console.log(validClientCredentials, token, response)
                    const headers = response.header
                    const responseBody = response.body
                    const cacheControl = headers['cache-control']
                    const pragma = headers['pragma']
                    const contentLength = headers['content-length']
                    // console.log(responseBody,headers)
                    expect(responseBody.aud).to.be.eql(validClientCredentials.client_id)
                    expect(responseBody.token_type).to.be.eql("Bearer")
                    expect(cacheControl).to.eql('no-store')
                    expect(pragma).to.eql('no-cache')
                    // expect(contentLength).to.be.eql('238')
                    expect(responseBody).to.be.an('object')
                })
                it("invalid token returns active:false", async () => {
                    const invalid_request = `?token=${validClientCredentials.client_secret}&token_hint=access_token`
                    const response = await request(app)
                        .post(`/auth/introspection${invalid_request}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                    const responseBody = response.body
                    expect(responseBody).to.be.an('object')
                    expect(responseBody).to.eql({active:false})
                })
                it("invalid token_hint error", async () => {
                    const invalid_request = `?token=${access_token}&token_hint=invalid`
                    const response = await request(app)
                        .post(`/auth/introspection${invalid_request}`)
                        .auth(validClientCredentials.client_id, validClientCredentials.client_secret)
                    const responseBody = response.body
                    expect(responseBody).to.be.an('object')
                    expect(responseBody).to.be.eql({ error: 'invalid token_hint' })
                })
            })
        })
    })
})