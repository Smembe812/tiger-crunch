import crypto from "crypto"
const assert = require('assert');
export default function makeClientManager({masterKey}){
    const mk = masterKey?.toString().split('-').join("+").split('_').join("/")
    const ISSUER = crypto.createDiffieHellman(Buffer.from(mk))
    const ISSUER_KEY = ISSUER.generateKeys();
    function generateSecretKey(){
        const client = crypto.createDiffieHellman(
            ISSUER.getPrime("base64"),
            "base64", 
            ISSUER.getGenerator()
        )
        const clientKey = client.generateKeys()
        return clientKey.toString("base64")
    }
    function validateClientKey({clientKey}){
        const client = crypto.createDiffieHellman(Buffer.from(clientKey))
        const key = client.generateKeys()
        const clientSecret = client.computeSecret(ISSUER_KEY);
        const issuerSecret = ISSUER.computeSecret(key);
        return assert.strictEqual(
            clientSecret.toString('base64'), 
            issuerSecret.toString('base64')
        );
    }
    return {
        generateSecretKey,
        validateClientKey
    }
}