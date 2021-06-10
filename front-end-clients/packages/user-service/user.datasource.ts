import level from "level"
export default class DBPool {
    pool
    constructor(name){
        this.pool = level(name,  { valueEncoding: 'json' })
    }
    async insert(obj){
        try {
            await this.pool.put(obj.email, obj)
            await this.pool.put(obj.id, obj.email)
            return await this.get(obj.email)
        } catch (error) {
            throw error   
        }
    }
    async get(email){
        return await this.pool.get(email)
    }
    async getById(id){
        try {
            const email = await this.pool.get(id)
            return await this.pool.get(email)
        } catch (error) {
            throw error
        }
    }
    async delete (email){
        return await this.pool.delete(email)
    }
}
