// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require('chai')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)
import sinon from 'sinon'
import { id_token_mock, introspectionInput, expected_introspection_response, validIdTokenPayload, validExpiredIdTokenPayload, expected_introspection_expired_response, wrong_token_id_payload} from '../data/introspection'
import Client from '@smembe812/clients-service'
import util from '@smembe812/util'
import {
	GrantTypes, 
	nonceManager,
	dataSource, 
	permissionsDataSource,
	tokenCache
} from '../../index'
const jwt = new util.JWT({
	keyStore: null
})
describe('Introspection',()=>{
	let grantTypes
	beforeEach(async () => {
		// not really using the database at all.
		// proper instatiation of datasorce required before tests run
		grantTypes = GrantTypes({jwt, keys:null})
	})
	afterEach(async function() {
		sinon.restore()
		await dataSource.close()
		await nonceManager.close()
		await permissionsDataSource.close()
	})
	it('returns a token info', async () => {
		sinon.stub(Client.useCases, 'verifyClientBySecret').resolves(true)
		sinon.stub(tokenCache, 'getToken').resolves({it:id_token_mock,rt:null,at:null})
		sinon.stub(jwt, 'verify').returns(validIdTokenPayload)
		const response = await grantTypes.introspection({...introspectionInput})
		expect(response).to.be.eql(expected_introspection_response)
	})
	it('returns active:false when token expired', async () => {
		sinon.stub(Client.useCases, 'verifyClientBySecret').resolves(true)
		sinon.stub(tokenCache, 'getToken').resolves({it:id_token_mock,rt:null,at:null})
		sinon.stub(jwt, 'verify').returns(validExpiredIdTokenPayload)
		const response = await grantTypes.introspection({...introspectionInput})
		expect(response).to.be.eql(expected_introspection_expired_response)
	})
	it('returns active:false when wrong token_id', async () => {
		sinon.stub(Client.useCases, 'verifyClientBySecret').resolves(true)
		sinon.stub(tokenCache, 'getToken').resolves({it:id_token_mock,rt:null,at:null})
		sinon.stub(jwt, 'verify').returns(wrong_token_id_payload)
		const response = await grantTypes.introspection({...introspectionInput})
		expect(response).to.be.eql(expected_introspection_expired_response)
	})
	it('handles exception', async () => {
		sinon.stub(Client.useCases, 'verifyClientBySecret').throwsException(new Error('Testing error'))
		sinon.stub(tokenCache, 'getToken').throwsException(new Error('Testing error'))
		sinon.stub(jwt, 'verify').throwsException(new Error('Testing error'))
		await expect(
			grantTypes.introspection({...introspectionInput})
		).to.be.rejectedWith('Testing error')
	})
})