// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require('chai')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)
import sinon from 'sinon'
import { access_token_mock, code_fake, dataSourceRes, expected_token, id_token_mock, refresh_token_mock, tokenInputMock, userIdMock} from '../data/token-grant'
import Client from '@smembe812/clients-service'
import util from '@smembe812/util'
import {
	GrantTypes, 
	nonceManager,
	dataSource, 
	permissionsDataSource, 
	permissionsUseCases,
	tokenCache
} from '../../index'
const jwt = new util.JWT({
	keyStore: null
})

describe('Token-grant',()=>{
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
	it('returns a token response', async () => {
		sinon.stub(util, 'generateRandomCode')
			.onFirstCall().resolves({code:refresh_token_mock, c_hash:null})
			.onSecondCall().resolves({code:access_token_mock, c_hash:null})
		sinon.stub(util, 'generateAccessToken').resolves({
			access_token:access_token_mock, 
			refresh_token: refresh_token_mock
		})
		sinon.stub(tokenCache, 'insert').returns(true)
		sinon.stub(Client.useCases, 'verifyClientBySecret').resolves(true)
		sinon.stub(jwt, 'sign').resolves(id_token_mock)
		sinon.stub(dataSource, 'get').resolves(dataSourceRes)
		sinon.stub(permissionsUseCases, 'getAvailablePermission').resolves(null)
		const response = await grantTypes.tokenGrant({...tokenInputMock})
		expect(response).to.be.eql(expected_token)
	})
	it('handles exception', async () => {
		sinon.stub(util, 'generateRandomCode')
			.onFirstCall().throwsException(new Error('Testing error'))
			.onSecondCall().throwsException(new Error('Testing error'))
		sinon.stub(util, 'generateAccessToken').throwsException(new Error('Testing error'))
		sinon.stub(tokenCache, 'insert').throwsException(new Error('Testing error'))
		sinon.stub(Client.useCases, 'verifyClientBySecret').throwsException(new Error('Testing error'))
		sinon.stub(jwt, 'sign').throwsException(new Error('Testing error'))
		sinon.stub(dataSource, 'get').throwsException(new Error('Testing error'))
		sinon.stub(permissionsUseCases, 'getAvailablePermission').throwsException(new Error('Testing error'))
		await expect(
			grantTypes.tokenGrant({...tokenInputMock})
		).to.be.rejectedWith('Testing error')
	})
})