import crypto from "crypto"
import util from "@smembe812/util"
export default function makeClientManager(){
    async function generateSecretKey():Promise<string>{
        const buf = await util.generateRandomBytes(256)
        const hmac_base64 = await util.generateHmac(buf)
        return hmac_base64
    }
    async function computePersistedSecretKey(secreteKey){
        const salt = await crypto.randomBytes(128).toString('base64');
        const iterations = 100000
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(secreteKey, salt, iterations, 64, 'sha512', (error, key) => {
                if(error) throw error;
                return resolve({hash:key.toString("hex"), salt, iterations});
            })
        })
    }
    async function validateClientKey({clientKey, salt, iterations, hash}){
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(clientKey, salt, iterations, 64, 'sha512', (error, key) => {
                if(error) throw error;
                return resolve(key.toString("hex") === hash);
            })
        })
    }
    return {
        generateSecretKey,
        validateClientKey,
        computePersistedSecretKey
    }
}