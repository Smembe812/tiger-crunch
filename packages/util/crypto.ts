import {createHash, randomBytes, createHmac} from 'crypto';
import {v4 as uuidv4} from "uuid"
export async function generateRandomCode():Promise<{code:string, c_hash:string}>{
    try {
        const random_buffer = await generateRandomBytes(256)
        const hash = await generateHash(random_buffer)
        const code_base64 = hash.digest('base64')
        const code_buf = Buffer.from(code_base64)
        const code_base64_url = toBase64Url(code_base64)
        const leftMostOctets = code_buf.slice(0,(code_buf.length/2))
        const c_hash = await generateHash(leftMostOctets)
        const c_hash_b64 = c_hash.digest("base64")
        const c_hash_b64_uri = toBase64Url(c_hash_b64)
        return Promise.resolve({code:code_base64_url, c_hash:c_hash_b64_uri})
    } catch (error) {
        throw error
    }
}
export async function verifyCode(code, code_hash):Promise<boolean>{
    const c_hash_buff= Buffer.from(toBase64(code_hash))
    const code_buf= Buffer.from(toBase64(code))
    const leftMostOctets = code_buf.slice(0,(code_buf.length/2))
    const calculated_c_hash = await generateHash(leftMostOctets)
    const calculated_c_hash_buf =  Buffer.from(calculated_c_hash.digest('base64'))
    const bufferDifference = Buffer.compare(
        c_hash_buff,
        calculated_c_hash_buf
    )
    return bufferDifference === 0
}
export function toBase64Url(word):string{
    return word.toString('base64').split('+').join("-").split('/').join("_")
}
export function toBase64(word):string{
    return word.toString('base64').split('-').join("+").split('_').join("/")
}
export async function generateHmac(random){
    const hmac = await createHmac('sha256', random);
    return hmac.digest("base64")
}
export async function generateRandomBytes(bytes:number):Promise<Buffer>{
    const random_buffer = await randomBytes(bytes)
    return random_buffer
}
export async function uuidV4(){
    return await uuidv4()
}
export async function generateHash(word, options=null){
    let hash;
    try {
        if(options?.algo){
            hash = await createHash(options.algo)
        }else{
            hash = await createHash("sha256")
        }
        hash.update(word)
        return hash
    } catch (error) {
        throw error
    }
}
export async function generateAccessToken(options=null){
    let tokens, rt={};
    if (options?.withRefreshToken === true){
        const {
            code:refresh_token, 
            c_hash:rt_hash
         } = await generateRandomCode()
        rt = {refresh_token, rt_hash}
    }
    const {
       code:access_token, 
       c_hash:at_hash
    } = await generateRandomCode()
    tokens = {...rt, access_token, at_hash}
    return tokens
}