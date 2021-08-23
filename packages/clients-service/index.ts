import makeClient from './client.entity'
import DataSource from './datasource'
import makeUseCases from './usecases'
import makeManager from './client-manager'
import util from '@smembe812/util'
const clientManager = makeManager()
const client = makeClient({
	clientManager, 
	validators:util.validators
})
const dataSource = new DataSource('clients')
const useCases = makeUseCases({
	clientManager, 
	dataSource,
	clientEntity:client,
	util
})
export default {
	client,
	useCases,
	dataSource
}