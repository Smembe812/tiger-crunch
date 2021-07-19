import SSOSession from './session'
const session = new SSOSession()
if(session.isLoaded()){
    session.setCheckSessionTimer()
    // rest of logged in logic
}else{
    // logic when not logged in
}
// window.addEventListener('message', (e) => console.log(e))