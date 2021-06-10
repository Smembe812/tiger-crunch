import fs from 'fs'
export const SEVER_KEY = fs.readFileSync('../../server-key.pem')
export const SEVER_CRT = fs.readFileSync('../../server-crt.pem')
export const AUTH_SIGNER_KEY = fs.readFileSync('./auth-signer-private-key.pem')
export const AUTH_PUB_KEY = fs.readFileSync("./auth-signer-public-key.pem")
export default {
    SEVER_KEY,
    SEVER_CRT,
    AUTH_SIGNER_KEY,
    AUTH_PUB_KEY
}