import level from "level"
export default class DBPool {
    pool
    constructor(name){
        this.pool = level(name,  { valueEncoding: 'json' })
    }
    async insert(obj){
        try {
            const userScopes = await this.get(obj.id)
            if(!userScopes){
                const scopeSet = new Set([obj.scope])
                return await this.pool.put(obj.id, Array.from(scopeSet))
            }else{
                const scopeSet = new Set([obj.scope, ...userScopes])
                return await this.pool.put(obj.id, Array.from(scopeSet))
            }
        } catch (error) {
            throw error   
        }
    }
    async get(id){
        return await this.pool.get(id)
    }
    async delete (id,scope){
        const availableScope = await this.get(id)
        const updated = availableScope.filter(s => scope !== s)
        return await this.insert({id, scope: [...updated]})
    }
    async wipe(id){
        return await this.pool.delete(id)
    }
}