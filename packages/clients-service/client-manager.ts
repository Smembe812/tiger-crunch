import crypto from "crypto"
const assert = require('assert');
export default function makeClientManager({masterKey}){
    const MASTER = crypto.createDiffieHellman(Buffer.from(masterKey))
    const MASTER_KEY = MASTER.generateKeys();
    function generateSecretKey(){
        const client = crypto.createDiffieHellman(Number(MASTER.getPrime()), MASTER.getGenerator())
        const clientKey = client.generateKeys()
        console.log(clientKey.toString("hex"))
        return clientKey
    }
    function validateClientKey({clientKey}){
        const client = crypto.createDiffieHellman(Buffer.from(clientKey))
        const key = client.generateKeys()
        const clientSecret = client.computeSecret(MASTER_KEY);
        const issuerSecret = MASTER.computeSecret(key);
        return assert.strictEqual(
            clientSecret.toString('hex'), 
            issuerSecret.toString('hex')
        );
    }
    return {
        generateSecretKey,
        validateClientKey
    }
}