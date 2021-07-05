import SSOSession from './session'
const session = new SSOSession()
console.log(session)
window.addEventListener('message', (e) => console.log(e))