import level from "level"
export default class DBPool {
    pool
    constructor(name){
        this.pool = level(name,  { valueEncoding: 'json' })
    }
    async insert(obj){
        try {
            await this.pool.put(obj.email, obj)
            return await this.get(obj.email)
        } catch (error) {
            throw error   
        }
    }
    async get(email){
        return await this.pool.get(email)
    }
    async delete (email){
        return await this.pool.delete(email)
    }
}
