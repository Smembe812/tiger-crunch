import DataSource from "./datasource"
export default class NonceManager extends DataSource{
    name
    constructor (name){
        super(`level-${name}`)
        this.name=name
    }
    async persistNonce(obj){
        const {nonce, ...rest} = obj
        return await this.pool.insert(nonce, rest)
    }
    async isAuthenticNonce(nonce){
        try {
            await this.pool.get(nonce)
            return false
        } catch (error) {
            if(error.message.includes("Key not found in database")){
                return true
            }
            throw error
        }
    }
}