import loginForm from "./log-in.html"
const body = document.getElementsByTagName('BODY')[0]
body.innerHTML = loginForm

const crypto = window.crypto ||  window.msCrypto;
const [subdomain, ...baseHost] = window.location.hostname.split('.')
const domain = baseHost.join('.')
// window.domain = domain
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const cb_token = urlParams.get('cb')
on_login.addEventListener('click', async function(e) {
    e.preventDefault();
    const error_span = document.querySelector("#error")
    const email = document.querySelector("#email_input").value
    const pin = document.querySelector("#pin_input").value
    const otp = document.querySelector("#otp_input").value
    const payload = {
        claims:{
            email,
            otp,
            proposedPIN: pin}
    }
    try {
        const BASE_URL = 'https://tiger-crunch.com:4433/auth';
        let authUrl;
        if (!cb_token){
            authUrl = BASE_URL
        } else{
            authUrl = `${BASE_URL}?cb_token=${cb_token}`
        }
        const response = await authenticateUser(authUrl,payload)
        if(response?.message){
            error_span.innerHTML = response.message
        }
        if(response?.redirectUri){
            window.location.replace(response.redirectUri)
        }
        console.log(response)
    } catch (error) {
        error_span.innerHTML = error.message
    }
})
function toBase64(word){
    return word.split('-').join('+').split('_').join('/')
}
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function importPublicKey(pem) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);
    return window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: {name: 'SHA-512'}
        },
        false,
        ["verify"]
    );
}
window.onerror = function(message, source, lineno, colno, error) { 
    console.log(message, source, lineno, colno, error)
};

if (window.Worker) {
    const myWorker = new Worker(new URL('./worker.js', import.meta.url));
    window.addEventListener("message", async (e) => {
        const token = document.cookie.split('id_token=s%3A')[1]
        const [h, p, s] = token.split('.')
        const header = toBase64(h)
        const payload = toBase64(p)
        const signature = toBase64(s)
//                 const rawPubKey = `-----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwfgC/cgSha3asB3UX5m83l7iilhKlITOWDQNlixIs5FvkBlyxqhtciUx9xcR/LyGEB/a9xh2+YoglwD76kM+bq/mGG5PI7Z9R8AhIuesgh0ubtIn4HCTJvkJHdMNSfk4HZpVw2KAn67qvcdzRnSGrkNuNeSC1jWYenc3RazGRP6mozFfinEOEdbZ7jndKo2TgoiPjaH6RXM5rebYPoHNsjL7hwY9Lv69cdjEz4Lp9JpM8yItJ4gX6NUDjTXnMS9YUiLerktGAVtM2PHdO1in5LZYP9OCR1fTGkrl1KASJHDgHwIjVgIHGQk18ccj8g0TkQPdmxmRguutd86Ew3RxAQIDAQAB
// -----END PUBLIC KEY-----`
//                 const pem = importPublicKey(rawPubKey)
//                 .then(async pem => {
//                     console.log(pem)
//                     const isValid = await window.crypto.subtle.verify(
//                         'RSA-SHA256',
//                         pem,
//                         signature, 
//                         'base64'
//                     )
//                     console.log(isValid)
//                 })
//                 .catch(error => console.log(error))
        // const verifySign = window.crypto.createVerify('RSA-SHA256')
        // const jwt = await import('jose-browser-runtime/jwt/verify')
        // const stuff = jwt.verify()
        // console.log(e, [JSON.parse(window.atob(payload))])   
        myWorker.postMessage([header, payload, signature, e]);
    }, false)
    myWorker.onmessage = function(e) {
        const [isValid, event] = e.data;
        console.log('Message received from worker ', e.data);
        event.source.postMessage("stat", event.origin);
    }
} 
else {
    console.log('Your browser doesn\'t support web workers.');
}

function OP(){
    this.receiveMessage = function receiveMessage(e){ // e.data has client_id and session_state
        console.log(e)
        const client_id = e.data.split(' ')[0];
        const session_state = e.data.split(' ')[1];
        const salt = session_state.split('.')[1];
        // if message is syntactically invalid
        //     postMessage('error', e.origin) and return

        // if message comes an unexpected origin
        //     postMessage('error', e.origin) and return

        // get_op_user_agent_state() is an OP defined function
        // that returns the User Agent's login status at the OP.
        // How it is done is entirely up to the OP.
        //var opuas = get_op_user_agent_state();

        // Here, the session_state is calculated in this particular way,
        // but it is entirely up to the OP how to do it under the
        // requirements defined in this specification.
        //var ss = crypto.SHA256(client_id + ' ' + e.origin + ' ' + opuas + ' ' + salt) + "." + salt;
        const stat = '';
        if (session_state) {
            stat = 'unchanged';
        } else {
            stat = 'changed';
        }
        e.source.postMessage(stat, e.origin);
    };
}
async function authenticateUser(url, payload){
    try {
        const response = await fetch(url,
            {
                method:"POST",
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Client': 'true'
                },
                mode: 'cors',
                redirect: 'follow',
                credentials: 'include'
            })
        return response.json()
    } catch (error) {
        console.error(error)
        throw error
    }
}