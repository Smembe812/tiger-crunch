import level from "level"
export default class DBPool {
    pool
    constructor(name){
        this.pool = level(name,  { valueEncoding: 'json' })
    }
    async insert(obj){
        try {
            const roles = await this.get(obj.id)
            if(!roles){
                return await this.pool.put(obj.id, [obj.role])
            }else{
                const hasRole:boolean = roles.join(" ").includes(obj.role)
                if(hasRole){
                    throw Error('role already assigned to user')
                }
                return await this.pool.put(obj.id, [...roles, obj.role])
            }
        } catch (error) {
            throw error   
        }
    }
    async get(id){
        return await this.pool.get(id)
    }
    async delete (id,role){
        const availableRole = await this.get(id)
        const updated = availableRole.filter(s => role !== s)
        return await this.insert({id, role: [...updated]})
    }
    async wipe(id){
        return await this.pool.delete(id)
    }
}