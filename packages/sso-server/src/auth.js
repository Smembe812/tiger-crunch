import loginForm from "./log-in.html"
// import JSEncrypt from "jsencrypt"
// import CryptoJS from "crypto-js"
import {jwtVerify} from "jose-browser-runtime/jwt/verify"
import {parseJwk} from "jose-browser-runtime/jwk/parse"
import { compactVerify } from 'jose-browser-runtime/jws/compact/verify'
// const verify = new JSEncrypt()
const body = document.getElementsByTagName('BODY')[0]
body.innerHTML = loginForm

const crypto = window.crypto ||  window.msCrypto;
const [subdomain, ...baseHost] = window.location.hostname.split('.')
const domain = baseHost.join('.')
// window.domain = domain
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const cb_token = urlParams.get('cb')
// session cookies
function loadSessionDetails(){
    const token = document.cookie.split('id_token=s%3A')[1]
    if (token){
        const [h, p, s, cookieSignature] = token.split('.')
        const {uaid, sub, aud} = JSON.parse(window.atob(p))
        const [sessionState,salt, cs] = document.cookie.split('session_state=s%3A')[1].split('.')
        return {
            uaid,sub,aud,sessionState,salt
        }
    }
    return null
}
function init(){
    // load session globals
    // get _uaid
}

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
window.onerror = function(message, source, lineno, colno, error) { 
    console.log(message, source, lineno, colno, error)
};

if (window.Worker) {
    const myWorker = new Worker(new URL('./worker.js', import.meta.url));
    myWorker.addEventListener('message', e => {
        // console.log(e)
        // const [isValid, event] = e.data;
        console.log('Message received from worker ', e.data);
        // event.source.postMessage("stat", event.origin);
    })
    window.addEventListener("message", async (e) => {
        if (e.origin === "https://client.tiger-crunch.com:3300"){
            console.log(e)
            // const token = document.cookie.split('id_token=s%3A')[1]
            // console.log(token.split('.'))
            // const [h, p, s,cs] = token.split('.')
            // const header = toBase64(h)
            // const payload = toBase64(p)
            // const signature = toBase64(s)
            // const rawsignature = window.atob(signature)
            // const msg = [header, payload, signature ]
            // const payload = loadSessionDetails()
            // send to worker to verify signature
            const tt = "eyJ0eXAiOiJqd3QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRPdk10TFFYQWtVN3hKSnJHNXMzNHhOMmdqaFdWVUgxOVoyOWZ5T0ZpTmMifQ.eyJleHAiOjE2Mjc3MjMxNDMsImlhdCI6MTYyNzYzNjc0Mywic3ViIjoidGVzdCJ9.Dh8h-eZLrkv5EYdPR26oEuJqNuALotTl4O8Cl1mombCpHXxXjlxqcj9yq78Uhx1NzdJCF_gzmxBanSkmpVBKRyrdXjz43HhPdkJ53u1G6EaypQWHVJw0JeuYSVGJUMngo8nhcwkby50EYftMp2SUsqRTFPW6cK12lg_gjyFrCgUkBr5rIBlj2OMgVhVt9RQY-iwjDS97ZCWnONKaJk7yGq9_7mc-o-zrqHULE-KRlOZ-gX18mAkyoNz5Ewhq3OVReqCbV848PnALHQ-ViiNLE9XaoIdKHliCi_zLEVrUaWCinKmkH4RJkn1-Dtpv3YAd605i-m1JjJ9HRRvjfk3UZA"
            const ttsig = toBase64(tt.split('.')[2])
            const ttrawsig = window.atob(ttsig)
// const rawPubKey = `-----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv6tIg+nHhvAWDKnbvu6TsgvaBl3lWhItIAkD2j0JaoH1edw/NTCQbw5GrRU9jezoTSk69HSXTNrz8O7eA0xT1/9knW00qnBziQVP2YZ0UpuhpVXDkTteaUAK//u10b7xns+jTvASBlKFjlwHQj/3uJ2RewFCMyLfVnu3n2IpknvU+n0VzzcWnFREp/wdS5ojHAT5NWtkaxFtIj7AdWeT+Ft7XOdAalnqlGsYkb6m+GewcKg/G5caIWjBzVZARVhReCfxtYrNvcuk8tHeb5Z6lBS1WXI+RYUWKERZB8q1ivWMqS9Z1x+ktU5/rmouV9+LbfjmdJmQ0WSnMb4Tqqkc1QIDAQAB
// -----END PUBLIC KEY-----`
// const pemHeader = "-----BEGIN PUBLIC KEY-----";
//     const pemFooter = "-----END PUBLIC KEY-----";
//     const pemContents = rawPubKey.substring(pemHeader.length, rawPubKey.length - pemFooter.length);
    

const rsaPublicKey = await parseJwk({
    "kty": "RSA",
    "kid": "tOvMtLQXAkU7xJJrG5s34xN2gjhWVUH19Z29fyOFiNc",
    "use": "sig",
    "alg": "RS256",
    "e": "AQAB",
    "n": "pTRdk2cbnt7uQTdEVXl82Vp9OHFson-fg2_M4yoEYK1mIQXknY1dN2btwch0piW-OLaYqTq8jz_RRIO_vkUwXbXeC4wLW_HXr4ZMmDvBECzEyH-eb6m61mNvc3NRo2CaAgFvNae6-TTtXcTecs7O5FNiaF_POZaMoLSEKyXiy-82t9EezmeRo2mQhJ37s6GX3pZHF9iAkXasLIzcTq8MweogxQGf8QhuKblVHfFPcgu0rPG_JDAvOpJVhmCmAvCUYCFQJVQXkhBMN0xi_i407uUpidOcslchBAR_wJu2QiFCA8jyXNwxtciNAhl5_oH3MSG_o3cIIPjYOepHe9lBGw"
  }, 'RS256')
  console.log(rsaPublicKey)
// verify.setPublicKey(rsaPublicKey)
    // const vs = verify.verify(ttrawsig, ttsig, CryptoJS.SHA256);
    const vs = await compactVerify(tt, rsaPublicKey)
    console.log(vs)


    myWorker.postMessage(msg);
        }
    }, false)
} 
else {
    console.log('Your browser doesn\'t support web workers.');
}
function OP(){
    this.receiveMessage = function receiveMessage(e){ // e.data has client_id and session_state
        console.log(e)
        const [clientId, sessionState] = e.data.split(' ')
        const salt = sessionState.split('.').pop()
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
        // var ss = crypto.SHA256(client_id + ' ' + e.origin + ' ' + opuas + ' ' + salt) + "." + salt;
        const stat = '';
        if (sessionState) {
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