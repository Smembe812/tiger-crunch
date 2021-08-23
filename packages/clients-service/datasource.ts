import level from 'level'
export default class ClientDBPool {
	pool
	constructor(name){
		this.pool = level(name,  { valueEncoding: 'json' })
	}
	async insert(obj){
		await this.pool.put(obj.id, obj)
		return await this.get(obj.id)
	}
	async get(id){
		try {
			return await this.pool.get(id)
		} catch (error) {
			if(error.message.includes('Key not found in database')){
				throw new Error('wrong client_id or client_secret provided')
			}
			throw error
		}
	}
	async delete (id){
		return await this.pool.delete(id)
	}
}