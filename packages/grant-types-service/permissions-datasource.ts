import level from "level"
export default class PermissionsPool {
    pool
    constructor(name){
        this.pool = level(name, { valueEncoding: 'json' })
    }
    async insert(obj:{
        id:string,
        permissions: Array<string>
    }){
        let input = obj.permissions;
        let response;
        if(input.length<1){
            throw new TypeError('obj.permissions cannot be empty')
        }
        try {
            const availablePermissions = await this.get(obj.id)
            if(availablePermissions.length > 0){
                const p = new Set([...availablePermissions, input])
                input = Array.from(p)
                await this.pool.put(obj.id, input)
                response = input
            }else{
                await this.pool.put(obj.id, input)
                response = input
            }
            return response
        } catch (error) {
            throw error   
        }
    }
    async removePermissions(obj:{
        id:string,
        permissions: Array<string>
    }){
        try {
            let input:string[] = obj.permissions;
            let response;
            if(input.length<1){
                throw new TypeError('obj.permissions cannot be empty')
            }
            const availablePermissions = await this.get(obj.id)
            if(availablePermissions.length > 0){
                const newPermissions = availablePermissions.filter(ap => !input.includes(ap))
                const inputSet = new Set(newPermissions)
                input = Array.from(inputSet) as string[]
                await this.pool.put(obj.id, input)
                response = input
            }else{
                await this.pool.put(obj.id, input)
                response = input
            }
            return response
        } catch (error) {
            throw error   
        }
    }
    async get(id){
        try {
            return await this.pool.get(id)
        } catch (error) {
            if (error.message.includes('Key not found in database')){
                return []
            }
            throw error
        }
    }
    async clear(id){
        return await this.pool.delete(id)
    }
    close(){
        return this.pool.close()
    }
}