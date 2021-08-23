/* eslint-disable require-jsdoc */
import loginForm from './log-in.html'
// import JSEncrypt from "jsencrypt"
// import CryptoJS from "crypto-js"
import {jwtVerify} from 'jose-browser-runtime/jwt/verify'
import {parseJwk} from 'jose-browser-runtime/jwk/parse'
import {compactVerify} from 'jose-browser-runtime/jws/compact/verify'
// const verify = new JSEncrypt()
const body = document.getElementsByTagName('BODY')[0]
body.innerHTML = loginForm

const crypto = window.crypto || window.msCrypto
const [subdomain, ...baseHost] = window.location.hostname.split('.')
// window.domain = domain
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
const cb_token = urlParams.get('cb')
// session cookies
// eslint-disable-next-line require-jsdoc
function loadSessionDetails() {
	const token = document.cookie.split('__IDT=s%3A')[1]
	if (token) {
		const [h, p, s] = token.split('.')
		const {uaid, sub, aud} = JSON.parse(window.atob(p))
		const [sessionState, salt, cs] = document.cookie.split('session_state=s%3A')[1].split('.')
		return {
			uaid, sub, aud, sessionState, salt,
		}
	}
	return null
}
async function loadKeys() {
	const jwks = await getJwk()
	localStorage.setItem('__k', JSON.stringify(jwks))
	return jwks
}
async function verifyJwt() {
	const k = JSON.parse(localStorage.getItem('__k')).keys[0]
	const rsaPublicKey = await parseJwk(k, 'RS256')
	const idToken = document.cookie.split('__IDT=s%3A')[1]
	const [h, p, s, cs] = idToken.split('.')
	return await compactVerify(`${h}.${p}.${s}`, rsaPublicKey)
}
window.onload = async function(e) {
	// get jwk from cookie
	const jwks = localStorage.getItem('__k')
	if (!jwks) {
		// get from auth endpoint
		await loadKeys()
	}
}
on_login.addEventListener('click', async function(e) {
	e.preventDefault()
	const error_span = document.querySelector('#error')
	const email = document.querySelector('#email_input').value
	const pin = document.querySelector('#pin_input').value
	const otp = document.querySelector('#otp_input').value
	const payload = {
		claims: {
			email,
			otp,
			proposedPIN: pin},
	}
	try {
		const BASE_URL = 'https://tiger-crunch.com:4433/auth'
		let authUrl
		if (!cb_token) {
			authUrl = BASE_URL
		} else {
			authUrl = `${BASE_URL}?cb_token=${cb_token}`
		}
		const response = await authenticateUser(authUrl, payload)
		if (response?.message) {
			error_span.innerHTML = response.message
		}
		if (response?.redirectUri) {
			window.location.replace(response.redirectUri)
		}
		console.log(response)
	} catch (error) {
		error_span.innerHTML = error.message
	}
})
function toBase64(word) {
	return word.split('-').join('+').split('_').join('/')
}
window.onerror = function(message, source, lineno, colno, error) {
	console.log(message, source, lineno, colno, error)
}

if (window.Worker) {
	const myWorker = new Worker(new URL('./worker.js', import.meta.url))
	myWorker.addEventListener('message', (e) => {
		// console.log(e)
		// const [isValid, event] = e.data;
		console.log('Message received from worker ', e.data)
		// event.source.postMessage("stat", event.origin);
	})
	window.addEventListener('message', async (e) => {
		if (e.origin === 'https://client.tiger-crunch.com:3300') {
			try {
				await verifyJwt()
			} catch (error) {
				await loadKeys()
				await verifyJwt()
			}
			myWorker.postMessage('msg')
		}
	}, false)
} else {
	console.log('Your browser doesn\'t support web workers.')
}
function OP() {
	this.receiveMessage = function receiveMessage(e) {
		// e.data has client_id and session_state
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
		// var opuas = get_op_user_agent_state();

		// Here, the session_state is calculated in this particular way,
		// but it is entirely up to the OP how to do it under the
		// requirements defined in this specification.
		// var ss = crypto.SHA256(client_id + ' ' + e.origin + ' ' + opuas + ' ' + salt) + "." + salt;
		let stat = ''
		if (sessionState) {
			stat = 'unchanged'
		} else {
			stat = 'changed'
		}
		e.source.postMessage(stat, e.origin)
	}
}
async function authenticateUser(url, payload) {
	try {
		const response = await fetch(url,
			{
				method: 'POST',
				body: JSON.stringify(payload),
				headers: {
					'Content-Type': 'application/json',
					'X-Auth-Client': 'true',
				},
				mode: 'cors',
				redirect: 'follow',
				credentials: 'include',
			})
		return response.json()
	} catch (error) {
		console.error(error)
		throw error
	}
}
async function getJwk() {
	const url = 'https://tiger-crunch.com:4433/jwks'
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Client': 'true',
			},
			mode: 'cors',
			redirect: 'follow',
			credentials: 'include',
		})
		return response.json()
	} catch (error) {
		console.log(error)
		throw error
	}
}
