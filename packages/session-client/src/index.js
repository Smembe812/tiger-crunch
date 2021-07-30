import SSOSession from './session'
const session = new SSOSession()
console.log(navigator)
// window.addEventListener('message', (e) => console.log(e))
class OIDClient {
    authUrl
    redirectUri
    responseType
    clientId
    location
    constructor({
        redirectUri,
        responseType,
        clientId
    }){
        this.authUrl = 'https://tiger-crunch.com:4433/auth',
        this.redirectUri = redirectUri
        this.responseType = responseType
        this.clientId = clientId
        const array = new Uint32Array(2);
        this.nonce = window.btoa(window.crypto.getRandomValues(array))
    }
    grantCodeFlow({
        scope,
        state
    }){
        const authUrl = `${this.authUrl}/code?response_type=${this.responseType}&scope=${scope}&client_id=${this.clientId}&state=${state}&redirect_uri=${this.redirectUri}`
        window.location.assign(authUrl)
        // return fetch(authUrl,{
        //     method: "GET",
        //     mode: 'cors',
        // })
        // .then(res => {
        //     console.log(res)
        // })
    }
    implicitFlow({
        scope,
        state
    }){
        const authUrl = `${this.authUrl}/implicit?response_type=${this.responseType}&scope=${scope}&client_id=${this.clientId}&state=${state}&redirect_uri=${this.redirectUri}&nonce=${this.nonce}`
        window.location.assign(authUrl)
    }
}
if(session.isLoaded()){
    session.setCheckSessionTimer()
    // rest of logged in logic
    // what makes an active session?
    // master ID + tokens for resources/services?
    // how to log out only a single service?
    // how to log out every service from one centraal point?
    // session daemon
}else{
    // logic when not logged in
    const oidClient = new OIDClient({
        clientId: "9b817b3b-6f5b-43f8-ad5e-0adfab697b01",
        redirectUri:"https://client.tiger-crunch.com:3300",
        responseType: 'id_token token'
    })
    oidClient.implicitFlow({
        scope: "openid profile email",
        state: "af0ifjsldkj"
    })
}