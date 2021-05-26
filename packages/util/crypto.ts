import {randomFill} from 'crypto';
export async function generateRandomCode():Promise<string>{
    return new Promise((resolve, reject) => {
        const buf = Buffer.alloc(10);
        randomFill(buf, (err, buf) => {
        if (err) throw err;
            resolve(buf.toString('hex'))
        });
    })
}