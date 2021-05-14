import crypto from "crypto"
export default function makeClientManager(){
    async function generateSecretKey(random){
        const hmac = crypto.createHmac('sha256', random);
        return hmac.digest("base64")
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