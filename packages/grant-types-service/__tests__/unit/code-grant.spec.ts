// eslint-disable-next-line @typescript-eslint/no-var-requires
const chai = require('chai')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)
import URL from 'url'
import sinon from 'sinon'
import { mockCode, mockInput } from '../data/grant-code'
import Client from '@smembe812/clients-service'
import util from '@smembe812/util'
const clientUseCases = Client.useCases
import {
	GrantTypes, 
	nonceManager,
	dataSource, 
	permissionsDataSource, 
	permissionsUseCases
} from '../../index'
const jwt = new util.JWT({
	keyStore:null
})
describe('Grant-code',()=>{
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
	it('can return redirect_uri with code and state on success', async () => {
		sinon.stub(util, 'generateRandomCode').resolves({code:mockCode, c_hash:null})    
		sinon.stub(clientUseCases, 'verifyClientByDomain').resolves(true)
		sinon.stub(dataSource, 'insert').resolves(true)
		sinon.stub(permissionsUseCases, 'getAvailablePermission').resolves(null)
		const redirectUri = await grantTypes.codeGrant({...mockInput})
		const parseduri = URL.parse(redirectUri)
		const uriHasCode = parseduri.query.includes(`code=${mockCode}`)
		const uriHasState = parseduri.query.includes(`state=${mockInput.state}`)
		expect(redirectUri).to.be.string
		expect(parseduri.protocol).to.be.eql('https:')
		expect(uriHasCode).to.be.true
		expect(uriHasState).to.be.true
	})
	it('can fail with error and error description', async () => {
		sinon.stub(util, 'generateRandomCode').resolves({code:mockCode, c_hash:null})    
		sinon.stub(clientUseCases, 'verifyClientByDomain').throws(new Error('invalid_request'))
		sinon.stub(permissionsUseCases, 'getAvailablePermission').resolves(null)
		const redirectUri = await grantTypes.codeGrant({...mockInput})
		const parseduri = URL.parse(redirectUri)
		const uriHasError = parseduri.query.includes('error=invalid_request')
		const uriHasErrorDescription = parseduri.query.includes('error_description=unauthorized_client')
		expect(redirectUri).to.be.string
		expect(parseduri.protocol).to.be.eql('https:')
		expect(uriHasError).to.be.true
		expect(uriHasErrorDescription).to.be.true
	})
	it('can handle exception', async () => {
		sinon.stub(util, 'generateRandomCode').throwsException('Testing error')    
		sinon.stub(clientUseCases, 'verifyClientByDomain').throwsException(new Error('Testing error'))
		await expect(
			grantTypes.codeGrant({...mockInput})
		).to.be.rejectedWith('Testing error')
	})
})