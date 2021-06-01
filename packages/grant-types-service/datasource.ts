import level from "level"
export default class GrantsPool {
    pool
    constructor(name){
        this.pool = level(name, { valueEncoding: 'json' })
    }
    async insert(obj){
        try {
            await this.pool.put(obj.code, obj)
            return await this.get(obj.code)
        } catch (error) {
            throw error   
        }
    }
    async get(code){
        return await this.pool.get(code)
    }
    async delete (code){
        return await this.pool.delete(code)
    }
    close(){
        return this.pool.close()
    }
}