// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require('chai')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)
import {URL} from 'url'
import sinon from 'sinon'
import { access_token_mock, expected_token, id_token_mock, refresh_token_mock, tokenInputMock, userIdMock} from '../data/token-grant'
import Client from '@smembe812/clients-service'
import util from '@smembe812/util'
import {
	GrantTypes, 
	nonceManager,
	dataSource, 
	permissionsDataSource, 
	permissionsUseCases
} from '../../index'
import { expectedImpResponse, mockImplicitInput, mockRedirectError, token } from '../data/implicit-flow'
const jwt = new util.JWT({
	keyStore: null
})
describe('Implicit-flow',()=>{
	let grantTypes, tokenCache
	beforeEach(async () => {
		// not really using the database at all.
		// proper instatiation of datasorce required before tests run
		tokenCache = null
		grantTypes = GrantTypes({jwt, keys:null})
	})
	afterEach(async function() {
		sinon.restore()
		await dataSource.close()
		await nonceManager.close()
		await permissionsDataSource.close()
	})
	it('returns a token, id_token response_uri', async () => {
		sinon.stub(util, 'generateRandomCode')
			.onFirstCall().resolves({code:access_token_mock, c_hash:null})
			.onSecondCall().resolves({code:refresh_token_mock, c_hash:null})
		sinon.stub(util, 'generateAccessToken').resolves({access_token:token.access_token})
		sinon.stub(Client.useCases, 'verifyClientByDomain').resolves(true)
		sinon.stub(jwt, 'sign').resolves(id_token_mock)
		sinon.stub(dataSource, 'get').resolves(userIdMock)
		sinon.stub(nonceManager, 'isAuthenticNonce').resolves(true)
		sinon.stub(nonceManager, 'persistNonce').resolves(mockImplicitInput.nonce)
		const response = await grantTypes.implicitFlow({...mockImplicitInput})
		const parseduri = new URL(response.redirectUri)
		const uriHasIdToken = parseduri.search.includes(`id_token=${token.id_token}`)
		const uriHasState = parseduri.search.includes(`state=${token.state}`)
		const uriHasAccessToken = parseduri.search.includes(`access_token=${token.access_token}`)
		const uriHasBeaerTokenType = parseduri.search.includes(`token_type=${token.token_type}`)
		expect(response.redirectUri).to.eql(expectedImpResponse)
		expect(uriHasIdToken).to.be.true
		expect(uriHasState).to.be.true
		expect(uriHasAccessToken).to.be.true
		expect(uriHasBeaerTokenType).to.be.true
	})
	it('creates redirect error', async () => {
		sinon.stub(util, 'generateRandomCode')
			.onFirstCall().throwsException(new Error('Testing_error'))
			.onSecondCall().throwsException(new Error('Testing_error'))
		sinon.stub(Client.useCases, 'verifyClientByDomain').throwsException(new Error('Testing_error'))
		sinon.stub(jwt, 'sign').throwsException(new Error('Testing_error'))
		sinon.stub(nonceManager, 'isAuthenticNonce').throwsException(new Error('Testing_error'))
		sinon.stub(nonceManager, 'persistNonce').throwsException(new Error('Testing_error'))
		sinon.stub(dataSource, 'get').throwsException(new Error('Testing_error'))
		const res = grantTypes.implicitFlow({...mockImplicitInput})
		await expect(
			res
		).to.be.rejectedWith('Testing_error')
		// redirectUri.then((p)=>p).catch(err=>console.log(err))
	})
//    it('handles exception', async () => {
//         sinon.stub(util, "generateRandomCode")
//             .onFirstCall().throwsException(new Error("Testing error"))
//             .onSecondCall().throwsException(new Error("Testing error"))
//         sinon.stub(Client.useCases, "verifyClientByDomain").throwsException(new Error("Testing error"))
//         sinon.stub(jwt, "sign").throwsException(new Error("Testing error"))
//         sinon.stub(dataSource, "get").throwsException(new Error("Testing error"))
//         await expect(
//             grantTypes.implicitFlow({...mockImplicitInput})
//         ).to.be.rejectedWith("Testing error")
//    })
})