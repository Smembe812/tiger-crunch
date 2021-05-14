import level from "level"
export default class ClientDBPool {
    pool
    constructor(name){
        this.pool = level(name,  { valueEncoding: 'json' })
    }
    async insert(obj){
        try {
            await this.pool.put(obj.id, obj)
            return await this.get(obj.id)
        } catch (error) {
            throw error   
        }
    }
    async get(id){
        return await this.pool.get(id)
    }
    async delete (id){
        return await this.pool.delete(id)
    }
}