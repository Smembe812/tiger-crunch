/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/log-in.html":
/*!*************************!*\
  !*** ./src/log-in.html ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Module
var code = "<form class=\"login-form\"> <div> <label for=\"email\">Email</label> <input type=\"text\" name=\"email\" id=\"email_input\"> </div> <div> <label for=\"pin\">PIN</label> <input type=\"password\" name=\"pin\" id=\"pin_input\"> </div> <div> <label for=\"otp\">OTP</label> <input type=\"text\" name=\"otp\" id=\"otp_input\"> </div> <button id=\"on_login\">Log In</button> <span id=\"error\"></span> </form> <script src=\"https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/8.0.20/jsrsasign-all-min.js\"></script> ";
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (code);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other entry modules.
(() => {
/*!***********************!*\
  !*** ./src/worker.js ***!
  \***********************/
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
onmessage = function(e) {
    console.log('Worker: Message received from main script');
    const [h, p, s, event] = e.data
    const rawPubKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwfgC/cgSha3asB3UX5m83l7iilhKlITOWDQNlixIs5FvkBlyxqhtciUx9xcR/LyGEB/a9xh2+YoglwD76kM+bq/mGG5PI7Z9R8AhIuesgh0ubtIn4HCTJvkJHdMNSfk4HZpVw2KAn67qvcdzRnSGrkNuNeSC1jWYenc3RazGRP6mozFfinEOEdbZ7jndKo2TgoiPjaH6RXM5rebYPoHNsjL7hwY9Lv69cdjEz4Lp9JpM8yItJ4gX6NUDjTXnMS9YUiLerktGAVtM2PHdO1in5LZYP9OCR1fTGkrl1KASJHDgHwIjVgIHGQk18ccj8g0TkQPdmxmRguutd86Ew3RxAQIDAQAB
-----END PUBLIC KEY-----`
    if (rawPubKey) {
        importPublicKey(rawPubKey)
        .then(async pem => {
            console.log(s, event)
            const isValid = await window.crypto.subtle.verify(
                'RSA-SHA256',
                pem,
                s, 
                'base64'
            )
            console.log(isValid)
            postMessage([isValid, event]);
        })
        .catch(error => console.log(error))
    } else {
        console.log('Worker: Posting message back to main script');
        postMessage("Nothing");
    }
}
})();

// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*********************!*\
  !*** ./src/auth.js ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _log_in_html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./log-in.html */ "./src/log-in.html");

const body = document.getElementByTagName('BODY')
body.innerHTML = _log_in_html__WEBPACK_IMPORTED_MODULE_0__.default

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
    const myWorker = new Worker("./worker.js");
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
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9Ac21lbWJlODEyL3Nzby1zZXJ2ZXIvLi9zcmMvbG9nLWluLmh0bWwiLCJ3ZWJwYWNrOi8vQHNtZW1iZTgxMi9zc28tc2VydmVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0BzbWVtYmU4MTIvc3NvLXNlcnZlci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vQHNtZW1iZTgxMi9zc28tc2VydmVyL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vQHNtZW1iZTgxMi9zc28tc2VydmVyL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vQHNtZW1iZTgxMi9zc28tc2VydmVyLy4vc3JjL3dvcmtlci5qcyIsIndlYnBhY2s6Ly9Ac21lbWJlODEyL3Nzby1zZXJ2ZXIvLi9zcmMvYXV0aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBLGlFQUFlLElBQUksRTs7Ozs7O1VDSG5CO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSxzREFBc0Qsa0JBQWtCO1dBQ3hFO1dBQ0EsK0NBQStDLGNBQWM7V0FDN0QsRTs7Ozs7Ozs7OztBQ05BO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QyxZQUFZO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsQzs7Ozs7Ozs7Ozs7QUNwRHFDO0FBQ3JDO0FBQ0EsaUJBQWlCLGlEQUFTOztBQUUxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QseUJBQXlCLFNBQVMsWUFBWSxTQUFTO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QyxZQUFZO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHFEQUFxRDtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxDIiwiZmlsZSI6Im1haW4uYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gTW9kdWxlXG52YXIgY29kZSA9IFwiPGZvcm0gY2xhc3M9XFxcImxvZ2luLWZvcm1cXFwiPiA8ZGl2PiA8bGFiZWwgZm9yPVxcXCJlbWFpbFxcXCI+RW1haWw8L2xhYmVsPiA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwiZW1haWxcXFwiIGlkPVxcXCJlbWFpbF9pbnB1dFxcXCI+IDwvZGl2PiA8ZGl2PiA8bGFiZWwgZm9yPVxcXCJwaW5cXFwiPlBJTjwvbGFiZWw+IDxpbnB1dCB0eXBlPVxcXCJwYXNzd29yZFxcXCIgbmFtZT1cXFwicGluXFxcIiBpZD1cXFwicGluX2lucHV0XFxcIj4gPC9kaXY+IDxkaXY+IDxsYWJlbCBmb3I9XFxcIm90cFxcXCI+T1RQPC9sYWJlbD4gPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcIm90cFxcXCIgaWQ9XFxcIm90cF9pbnB1dFxcXCI+IDwvZGl2PiA8YnV0dG9uIGlkPVxcXCJvbl9sb2dpblxcXCI+TG9nIEluPC9idXR0b24+IDxzcGFuIGlkPVxcXCJlcnJvclxcXCI+PC9zcGFuPiA8L2Zvcm0+IDxzY3JpcHQgc3JjPVxcXCJodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9qc3JzYXNpZ24vOC4wLjIwL2pzcnNhc2lnbi1hbGwtbWluLmpzXFxcIj48L3NjcmlwdD4gXCI7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBjb2RlOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiZnVuY3Rpb24gc3RyMmFiKHN0cikge1xuICAgIGNvbnN0IGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcihzdHIubGVuZ3RoKTtcbiAgICBjb25zdCBidWZWaWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmKTtcbiAgICBmb3IgKGxldCBpID0gMCwgc3RyTGVuID0gc3RyLmxlbmd0aDsgaSA8IHN0ckxlbjsgaSsrKSB7XG4gICAgYnVmVmlld1tpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIH1cbiAgICByZXR1cm4gYnVmO1xufVxuZnVuY3Rpb24gaW1wb3J0UHVibGljS2V5KHBlbSkge1xuICAgIC8vIGZldGNoIHRoZSBwYXJ0IG9mIHRoZSBQRU0gc3RyaW5nIGJldHdlZW4gaGVhZGVyIGFuZCBmb290ZXJcbiAgICBjb25zdCBwZW1IZWFkZXIgPSBcIi0tLS0tQkVHSU4gUFVCTElDIEtFWS0tLS0tXCI7XG4gICAgY29uc3QgcGVtRm9vdGVyID0gXCItLS0tLUVORCBQVUJMSUMgS0VZLS0tLS1cIjtcbiAgICBjb25zdCBwZW1Db250ZW50cyA9IHBlbS5zdWJzdHJpbmcocGVtSGVhZGVyLmxlbmd0aCwgcGVtLmxlbmd0aCAtIHBlbUZvb3Rlci5sZW5ndGgpO1xuICAgIC8vIGJhc2U2NCBkZWNvZGUgdGhlIHN0cmluZyB0byBnZXQgdGhlIGJpbmFyeSBkYXRhXG4gICAgY29uc3QgYmluYXJ5RGVyU3RyaW5nID0gd2luZG93LmF0b2IocGVtQ29udGVudHMpO1xuICAgIC8vIGNvbnZlcnQgZnJvbSBhIGJpbmFyeSBzdHJpbmcgdG8gYW4gQXJyYXlCdWZmZXJcbiAgICBjb25zdCBiaW5hcnlEZXIgPSBzdHIyYWIoYmluYXJ5RGVyU3RyaW5nKTtcbiAgICByZXR1cm4gd2luZG93LmNyeXB0by5zdWJ0bGUuaW1wb3J0S2V5KFxuICAgICAgICBcInNwa2lcIixcbiAgICAgICAgYmluYXJ5RGVyLFxuICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnUlNBU1NBLVBLQ1MxLXYxXzUnLFxuICAgICAgICAgICAgaGFzaDoge25hbWU6ICdTSEEtNTEyJ31cbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgIFtcInZlcmlmeVwiXVxuICAgICk7XG59XG5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5sb2coJ1dvcmtlcjogTWVzc2FnZSByZWNlaXZlZCBmcm9tIG1haW4gc2NyaXB0Jyk7XG4gICAgY29uc3QgW2gsIHAsIHMsIGV2ZW50XSA9IGUuZGF0YVxuICAgIGNvbnN0IHJhd1B1YktleSA9IGAtLS0tLUJFR0lOIFBVQkxJQyBLRVktLS0tLVxuTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF3ZmdDL2NnU2hhM2FzQjNVWDVtODNsN2lpbGhLbElUT1dEUU5saXhJczVGdmtCbHl4cWh0Y2lVeDl4Y1IvTHlHRUIvYTl4aDIrWW9nbHdENzZrTSticS9tR0c1UEk3WjlSOEFoSXVlc2doMHVidEluNEhDVEp2a0pIZE1OU2ZrNEhacFZ3MktBbjY3cXZjZHpSblNHcmtOdU5lU0MxaldZZW5jM1JhekdSUDZtb3pGZmluRU9FZGJaN2puZEtvMlRnb2lQamFINlJYTTVyZWJZUG9ITnNqTDdod1k5THY2OWNkakV6NExwOUpwTTh5SXRKNGdYNk5VRGpUWG5NUzlZVWlMZXJrdEdBVnRNMlBIZE8xaW41TFpZUDlPQ1IxZlRHa3JsMUtBU0pIRGdId0lqVmdJSEdRazE4Y2NqOGcwVGtRUGRteG1SZ3V1dGQ4NkV3M1J4QVFJREFRQUJcbi0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLWBcbiAgICBpZiAocmF3UHViS2V5KSB7XG4gICAgICAgIGltcG9ydFB1YmxpY0tleShyYXdQdWJLZXkpXG4gICAgICAgIC50aGVuKGFzeW5jIHBlbSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzLCBldmVudClcbiAgICAgICAgICAgIGNvbnN0IGlzVmFsaWQgPSBhd2FpdCB3aW5kb3cuY3J5cHRvLnN1YnRsZS52ZXJpZnkoXG4gICAgICAgICAgICAgICAgJ1JTQS1TSEEyNTYnLFxuICAgICAgICAgICAgICAgIHBlbSxcbiAgICAgICAgICAgICAgICBzLCBcbiAgICAgICAgICAgICAgICAnYmFzZTY0J1xuICAgICAgICAgICAgKVxuICAgICAgICAgICAgY29uc29sZS5sb2coaXNWYWxpZClcbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKFtpc1ZhbGlkLCBldmVudF0pO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5sb2coZXJyb3IpKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdXb3JrZXI6IFBvc3RpbmcgbWVzc2FnZSBiYWNrIHRvIG1haW4gc2NyaXB0Jyk7XG4gICAgICAgIHBvc3RNZXNzYWdlKFwiTm90aGluZ1wiKTtcbiAgICB9XG59IiwiaW1wb3J0IGxvZ2luRm9ybSBmcm9tIFwiLi9sb2ctaW4uaHRtbFwiXG5jb25zdCBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5VGFnTmFtZSgnQk9EWScpXG5ib2R5LmlubmVySFRNTCA9IGxvZ2luRm9ybVxuXG5jb25zdCBjcnlwdG8gPSB3aW5kb3cuY3J5cHRvIHx8ICB3aW5kb3cubXNDcnlwdG87XG5jb25zdCBbc3ViZG9tYWluLCAuLi5iYXNlSG9zdF0gPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuc3BsaXQoJy4nKVxuY29uc3QgZG9tYWluID0gYmFzZUhvc3Quam9pbignLicpXG4vLyB3aW5kb3cuZG9tYWluID0gZG9tYWluXG5jb25zdCBxdWVyeVN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG5jb25zdCB1cmxQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHF1ZXJ5U3RyaW5nKTtcbmNvbnN0IGNiX3Rva2VuID0gdXJsUGFyYW1zLmdldCgnY2InKVxub25fbG9naW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGVycm9yX3NwYW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Vycm9yXCIpXG4gICAgY29uc3QgZW1haWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2VtYWlsX2lucHV0XCIpLnZhbHVlXG4gICAgY29uc3QgcGluID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwaW5faW5wdXRcIikudmFsdWVcbiAgICBjb25zdCBvdHAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI290cF9pbnB1dFwiKS52YWx1ZVxuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgIGNsYWltczp7XG4gICAgICAgICAgICBlbWFpbCxcbiAgICAgICAgICAgIG90cCxcbiAgICAgICAgICAgIHByb3Bvc2VkUElOOiBwaW59XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IEJBU0VfVVJMID0gJ2h0dHBzOi8vdGlnZXItY3J1bmNoLmNvbTo0NDMzL2F1dGgnO1xuICAgICAgICBsZXQgYXV0aFVybDtcbiAgICAgICAgaWYgKCFjYl90b2tlbil7XG4gICAgICAgICAgICBhdXRoVXJsID0gQkFTRV9VUkxcbiAgICAgICAgfSBlbHNle1xuICAgICAgICAgICAgYXV0aFVybCA9IGAke0JBU0VfVVJMfT9jYl90b2tlbj0ke2NiX3Rva2VufWBcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF1dGhlbnRpY2F0ZVVzZXIoYXV0aFVybCxwYXlsb2FkKVxuICAgICAgICBpZihyZXNwb25zZT8ubWVzc2FnZSl7XG4gICAgICAgICAgICBlcnJvcl9zcGFuLmlubmVySFRNTCA9IHJlc3BvbnNlLm1lc3NhZ2VcbiAgICAgICAgfVxuICAgICAgICBpZihyZXNwb25zZT8ucmVkaXJlY3RVcmkpe1xuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UocmVzcG9uc2UucmVkaXJlY3RVcmkpXG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3Jfc3Bhbi5pbm5lckhUTUwgPSBlcnJvci5tZXNzYWdlXG4gICAgfVxufSlcbmZ1bmN0aW9uIHRvQmFzZTY0KHdvcmQpe1xuICAgIHJldHVybiB3b3JkLnNwbGl0KCctJykuam9pbignKycpLnNwbGl0KCdfJykuam9pbignLycpXG59XG5mdW5jdGlvbiBzdHIyYWIoc3RyKSB7XG4gICAgY29uc3QgYnVmID0gbmV3IEFycmF5QnVmZmVyKHN0ci5sZW5ndGgpO1xuICAgIGNvbnN0IGJ1ZlZpZXcgPSBuZXcgVWludDhBcnJheShidWYpO1xuICAgIGZvciAobGV0IGkgPSAwLCBzdHJMZW4gPSBzdHIubGVuZ3RoOyBpIDwgc3RyTGVuOyBpKyspIHtcbiAgICBidWZWaWV3W2ldID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiBidWY7XG59XG5mdW5jdGlvbiBpbXBvcnRQdWJsaWNLZXkocGVtKSB7XG4gICAgLy8gZmV0Y2ggdGhlIHBhcnQgb2YgdGhlIFBFTSBzdHJpbmcgYmV0d2VlbiBoZWFkZXIgYW5kIGZvb3RlclxuICAgIGNvbnN0IHBlbUhlYWRlciA9IFwiLS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS1cIjtcbiAgICBjb25zdCBwZW1Gb290ZXIgPSBcIi0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLVwiO1xuICAgIGNvbnN0IHBlbUNvbnRlbnRzID0gcGVtLnN1YnN0cmluZyhwZW1IZWFkZXIubGVuZ3RoLCBwZW0ubGVuZ3RoIC0gcGVtRm9vdGVyLmxlbmd0aCk7XG4gICAgLy8gYmFzZTY0IGRlY29kZSB0aGUgc3RyaW5nIHRvIGdldCB0aGUgYmluYXJ5IGRhdGFcbiAgICBjb25zdCBiaW5hcnlEZXJTdHJpbmcgPSB3aW5kb3cuYXRvYihwZW1Db250ZW50cyk7XG4gICAgLy8gY29udmVydCBmcm9tIGEgYmluYXJ5IHN0cmluZyB0byBhbiBBcnJheUJ1ZmZlclxuICAgIGNvbnN0IGJpbmFyeURlciA9IHN0cjJhYihiaW5hcnlEZXJTdHJpbmcpO1xuICAgIHJldHVybiB3aW5kb3cuY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoXG4gICAgICAgIFwic3BraVwiLFxuICAgICAgICBiaW5hcnlEZXIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdSU0FTU0EtUEtDUzEtdjFfNScsXG4gICAgICAgICAgICBoYXNoOiB7bmFtZTogJ1NIQS01MTInfVxuICAgICAgICB9LFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgW1widmVyaWZ5XCJdXG4gICAgKTtcbn1cbndpbmRvdy5vbmVycm9yID0gZnVuY3Rpb24obWVzc2FnZSwgc291cmNlLCBsaW5lbm8sIGNvbG5vLCBlcnJvcikgeyBcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlLCBzb3VyY2UsIGxpbmVubywgY29sbm8sIGVycm9yKVxufTtcblxuaWYgKHdpbmRvdy5Xb3JrZXIpIHtcbiAgICBjb25zdCBteVdvcmtlciA9IG5ldyBXb3JrZXIoXCIuL3dvcmtlci5qc1wiKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgY29uc3QgdG9rZW4gPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJ2lkX3Rva2VuPXMlM0EnKVsxXVxuICAgICAgICBjb25zdCBbaCwgcCwgc10gPSB0b2tlbi5zcGxpdCgnLicpXG4gICAgICAgIGNvbnN0IGhlYWRlciA9IHRvQmFzZTY0KGgpXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB0b0Jhc2U2NChwKVxuICAgICAgICBjb25zdCBzaWduYXR1cmUgPSB0b0Jhc2U2NChzKVxuLy8gICAgICAgICAgICAgICAgIGNvbnN0IHJhd1B1YktleSA9IGAtLS0tLUJFR0lOIFBVQkxJQyBLRVktLS0tLVxuLy8gTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF3ZmdDL2NnU2hhM2FzQjNVWDVtODNsN2lpbGhLbElUT1dEUU5saXhJczVGdmtCbHl4cWh0Y2lVeDl4Y1IvTHlHRUIvYTl4aDIrWW9nbHdENzZrTSticS9tR0c1UEk3WjlSOEFoSXVlc2doMHVidEluNEhDVEp2a0pIZE1OU2ZrNEhacFZ3MktBbjY3cXZjZHpSblNHcmtOdU5lU0MxaldZZW5jM1JhekdSUDZtb3pGZmluRU9FZGJaN2puZEtvMlRnb2lQamFINlJYTTVyZWJZUG9ITnNqTDdod1k5THY2OWNkakV6NExwOUpwTTh5SXRKNGdYNk5VRGpUWG5NUzlZVWlMZXJrdEdBVnRNMlBIZE8xaW41TFpZUDlPQ1IxZlRHa3JsMUtBU0pIRGdId0lqVmdJSEdRazE4Y2NqOGcwVGtRUGRteG1SZ3V1dGQ4NkV3M1J4QVFJREFRQUJcbi8vIC0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLWBcbi8vICAgICAgICAgICAgICAgICBjb25zdCBwZW0gPSBpbXBvcnRQdWJsaWNLZXkocmF3UHViS2V5KVxuLy8gICAgICAgICAgICAgICAgIC50aGVuKGFzeW5jIHBlbSA9PiB7XG4vLyAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHBlbSlcbi8vICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNWYWxpZCA9IGF3YWl0IHdpbmRvdy5jcnlwdG8uc3VidGxlLnZlcmlmeShcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICdSU0EtU0hBMjU2Jyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHBlbSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hdHVyZSwgXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAnYmFzZTY0J1xuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGlzVmFsaWQpXG4vLyAgICAgICAgICAgICAgICAgfSlcbi8vICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5sb2coZXJyb3IpKVxuICAgICAgICAvLyBjb25zdCB2ZXJpZnlTaWduID0gd2luZG93LmNyeXB0by5jcmVhdGVWZXJpZnkoJ1JTQS1TSEEyNTYnKVxuICAgICAgICAvLyBjb25zdCBqd3QgPSBhd2FpdCBpbXBvcnQoJ2pvc2UtYnJvd3Nlci1ydW50aW1lL2p3dC92ZXJpZnknKVxuICAgICAgICAvLyBjb25zdCBzdHVmZiA9IGp3dC52ZXJpZnkoKVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhlLCBbSlNPTi5wYXJzZSh3aW5kb3cuYXRvYihwYXlsb2FkKSldKSAgIFxuICAgICAgICBteVdvcmtlci5wb3N0TWVzc2FnZShbaGVhZGVyLCBwYXlsb2FkLCBzaWduYXR1cmUsIGVdKTtcbiAgICB9LCBmYWxzZSlcbiAgICBteVdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNvbnN0IFtpc1ZhbGlkLCBldmVudF0gPSBlLmRhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNZXNzYWdlIHJlY2VpdmVkIGZyb20gd29ya2VyICcsIGUuZGF0YSk7XG4gICAgICAgIGV2ZW50LnNvdXJjZS5wb3N0TWVzc2FnZShcInN0YXRcIiwgZXZlbnQub3JpZ2luKTtcbiAgICB9XG59IFxuZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ1lvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCB3ZWIgd29ya2Vycy4nKTtcbn1cblxuZnVuY3Rpb24gT1AoKXtcbiAgICB0aGlzLnJlY2VpdmVNZXNzYWdlID0gZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UoZSl7IC8vIGUuZGF0YSBoYXMgY2xpZW50X2lkIGFuZCBzZXNzaW9uX3N0YXRlXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXG4gICAgICAgIGNvbnN0IGNsaWVudF9pZCA9IGUuZGF0YS5zcGxpdCgnICcpWzBdO1xuICAgICAgICBjb25zdCBzZXNzaW9uX3N0YXRlID0gZS5kYXRhLnNwbGl0KCcgJylbMV07XG4gICAgICAgIGNvbnN0IHNhbHQgPSBzZXNzaW9uX3N0YXRlLnNwbGl0KCcuJylbMV07XG4gICAgICAgIC8vIGlmIG1lc3NhZ2UgaXMgc3ludGFjdGljYWxseSBpbnZhbGlkXG4gICAgICAgIC8vICAgICBwb3N0TWVzc2FnZSgnZXJyb3InLCBlLm9yaWdpbikgYW5kIHJldHVyblxuXG4gICAgICAgIC8vIGlmIG1lc3NhZ2UgY29tZXMgYW4gdW5leHBlY3RlZCBvcmlnaW5cbiAgICAgICAgLy8gICAgIHBvc3RNZXNzYWdlKCdlcnJvcicsIGUub3JpZ2luKSBhbmQgcmV0dXJuXG5cbiAgICAgICAgLy8gZ2V0X29wX3VzZXJfYWdlbnRfc3RhdGUoKSBpcyBhbiBPUCBkZWZpbmVkIGZ1bmN0aW9uXG4gICAgICAgIC8vIHRoYXQgcmV0dXJucyB0aGUgVXNlciBBZ2VudCdzIGxvZ2luIHN0YXR1cyBhdCB0aGUgT1AuXG4gICAgICAgIC8vIEhvdyBpdCBpcyBkb25lIGlzIGVudGlyZWx5IHVwIHRvIHRoZSBPUC5cbiAgICAgICAgLy92YXIgb3B1YXMgPSBnZXRfb3BfdXNlcl9hZ2VudF9zdGF0ZSgpO1xuXG4gICAgICAgIC8vIEhlcmUsIHRoZSBzZXNzaW9uX3N0YXRlIGlzIGNhbGN1bGF0ZWQgaW4gdGhpcyBwYXJ0aWN1bGFyIHdheSxcbiAgICAgICAgLy8gYnV0IGl0IGlzIGVudGlyZWx5IHVwIHRvIHRoZSBPUCBob3cgdG8gZG8gaXQgdW5kZXIgdGhlXG4gICAgICAgIC8vIHJlcXVpcmVtZW50cyBkZWZpbmVkIGluIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgICAgICAgLy92YXIgc3MgPSBjcnlwdG8uU0hBMjU2KGNsaWVudF9pZCArICcgJyArIGUub3JpZ2luICsgJyAnICsgb3B1YXMgKyAnICcgKyBzYWx0KSArIFwiLlwiICsgc2FsdDtcbiAgICAgICAgY29uc3Qgc3RhdCA9ICcnO1xuICAgICAgICBpZiAoc2Vzc2lvbl9zdGF0ZSkge1xuICAgICAgICAgICAgc3RhdCA9ICd1bmNoYW5nZWQnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdCA9ICdjaGFuZ2VkJztcbiAgICAgICAgfVxuICAgICAgICBlLnNvdXJjZS5wb3N0TWVzc2FnZShzdGF0LCBlLm9yaWdpbik7XG4gICAgfTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGF1dGhlbnRpY2F0ZVVzZXIodXJsLCBwYXlsb2FkKXtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6XCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICAgICAnWC1BdXRoLUNsaWVudCc6ICd0cnVlJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyxcbiAgICAgICAgICAgICAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gICAgICAgICAgICB9KVxuICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICAgICAgdGhyb3cgZXJyb3JcbiAgICB9XG59Il0sInNvdXJjZVJvb3QiOiIifQ==