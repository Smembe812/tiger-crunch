import SSOSession from './session'
const session = new SSOSession()
window.addEventListener('message', (e) => console.log(e))