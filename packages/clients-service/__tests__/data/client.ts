import util from "@smembe812/util"
export const client = {
    email:"findyourcat@app.com",
    projectName:"findyourcat",
    domain:"findyourcat.com",
    id:"fdd885ee-e6fe-4ffa-b679-beb7766c187a",
    secret:"Fya8B+GYzW9pbMHCBGT85/yRnsi9DlRBzvQ2R6yKYWs="
}
export const {secret:client_secret_base64_fake, ...clientWithoutSecret} = client
export const {id, ...clientWithoutId} = clientWithoutSecret
export const hash="217c4f41e3a7833b64b23acc95037312119a33dbfd101a7919bdcea976217133b5390e00b24ef9979bc02d5687025a225f196fc05de16236dbae2e5be8921713"
export const hashedSecret = {hash, salt:"randomsalt", iterations:100000}
export const client_secret_base64_uri_fake = util.toBase64Url(client_secret_base64_fake)
export const clientOutPut={
    ...clientWithoutSecret,
    client_secret:client_secret_base64_uri_fake
}