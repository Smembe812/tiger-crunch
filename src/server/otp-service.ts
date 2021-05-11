import speakeasy from "speakeasy"
import QRCode from "qrcode"
export function verify({secret, encoding, token}){
    return speakeasy.totp.verify({secret, encoding, token})
}
export function generateSecret(props){
    return speakeasy.generateSecret({...props})
}
export async function generateQRCode() : Promise<{
    secret,data_url
}>{
    return new Promise(async (resolve, reject) => {
        const secret = speakeasy.generateSecret({length: 10});
        QRCode.toDataURL(secret.otpauth_url, async(err, data_url)=>{
            if (err) throw err
            return resolve({secret, data_url});
        });
    })
}
export default {
    generateQRCode,
    generateSecret,
    verify
}