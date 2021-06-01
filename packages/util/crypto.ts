import {createHash, randomBytes, createHmac} from 'crypto';
export async function generateRandomCode():Promise<{code:string, c_hash:string}>{
    try {
        const random_buffer = await generateRandomBytes(256)
        const hash = await createHash("sha256")
        const c_hash = await createHash("sha256")
        hash.update(random_buffer)
        const code_buf = hash.digest()
        const code_base64 = code_buf.toString('base64')
        const code_base64_url = toBase64Url(code_base64)
        const leftMostOctets = code_buf.slice(0,(code_buf.length/2))
        const c_hash_b64 = c_hash.update(leftMostOctets).digest("base64")
        const c_hash_b64_uri = toBase64Url(c_hash_b64)
        return Promise.resolve({code:code_base64_url, c_hash:c_hash_b64_uri})
    } catch (error) {
        throw error
    }
}
export function toBase64Url(word):string{
    return word.toString('base64').split('+').join("-").split('/').join("_")
}
export function generateHmac(random){
    const hmac = createHmac('sha256', random);
    return hmac.digest("base64")
}
export async function generateRandomBytes(bytes:number):Promise<Buffer>{
    const random_buffer = await randomBytes(bytes)
    return random_buffer
}