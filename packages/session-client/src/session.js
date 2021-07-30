function RP({
    opFrameId,
    targetOrigin=null,
    clientId,
    sessionState
}){
    // logic only works when user is loged in
    this.stat = "unchanged";
    this.clientId=clientId;
    this.sessionState=sessionState;
    this.message = `${this.clientId } ${this.sessionState}`;
    this.targetOrigin = targetOrigin || "https://auth.tiger-crunch.com:3000"; // Validates origin
    this.opFrameId = opFrameId;
    this.timerID;
    this.checkSession = function checkSession(opFrameId, target, message){
        const win = window.parent.frames[opFrameId].contentWindow
        win.postMessage(message, "*");
    }
    this.setClientId = function setClientId(clientId){
        this.clientId = clientId;
        return this;
    }
    this.setSessionState = function setSessionState(sessionState){
        this.setSessionState = sessionState;
        return this;
    }
    this._setMessage = function _setMessage(){
        this.message = `${this.clientId } ${this.sessionState}`;
        return this
    }
    this.receiveMessage = function receiveMessage(e) {
        // console.log(e.origin, this.targetOrigin)
        if (e.origin !== this.targetOrigin) {
            return;
        }
        this.stat = e.data;
        if (this.stat === "changed") {
            clearInterval(this.timerID);
            window.addEventListener(this.message, receiveMessage, false);
        // then take the actions below...
        }
    }
    this.setTimer = function setTimer() {
        if(!this.sessionState && !this.clientId){
            throw new Errow('no session details loaded')
        }
        this.checkSession(this.opFrameId, null, this.message);
        this.timerID = setInterval(
            this.checkSession, 
            5 * 1000, 
            this.opFrameId, 
            null, 
            this.message
        );
    }
}
class SSOSession {
    clientId;
    sessionState;
    rp;
    constructor (){
        this.loadSession()
            .loadIframe()
        this.rp = new RP({
            opFrameId:'op',
            clientId:this.clientId,
            sessionState:this.sessionState
        })
    }
    loadSession (){
        this.sessionState = sessionStorage.getItem('sessionState') || null
        this.clientId = sessionStorage.getItem('clientId') || null
        if (!this.clientId){
            const uri = new URL(window.location.href)
            const idToken = uri.searchParams.get('id_token')
            const at = uri.searchParams.get('access_token')
            const tokenType = uri.searchParams.get('token_type')
            const expiresIn = uri.searchParams.get('expires_in')
            const state = uri.searchParams.get('state')
            if(idToken && at && state && expiresIn){
                const [h,p,s] = idToken.split('.')
                const {aud,sub,...rest} = JSON.parse(window.atob(p))
                this.clientId = aud
                this.sessionState = `${this.clientId}.${state}`
                console.log(this.sessionState)
            }
        }
        return this
    }
    isLoaded(){
        return (!!this.clientId && !!this.sessionState)
    }
    loadIframe(){
        const opIFrame = /*html*/`
            <iframe id="op" 
                src="https://auth.tiger-crunch.com:3000" 
                sandbox="allow-same-origin allow-scripts" 
                style="position: absolute;width:0;height:0;border:0;" 
                frameborder="0" 
                seamless="seamless"
                referrerpolicy="origin">
            </iframe>
        `
        const iframeContainer = document.createElement("div")
        iframeContainer.innerHTML = `${opIFrame}`
        document.body.appendChild(iframeContainer)
        return this
    }
    setCheckSessionTimer(){
        return this.rp.setTimer()
    }
    getSessionInfo(){
        return {
            clientId: this.clientId,
            sessionState: this.sessionState
        }
    }
    // const [subdomain, ...baseHost] = window.location.hostname.split('.')
    // const domain = baseHost.join('.')
    // window.domain = domain
    // console.log(window.domain)
    // this.rp.setTimer()
    // this.sessionStatus = function sessionStatus(){
    //     return {
    //         status: this.rp.stat,
    //     }
    // }
}
window.SSOSession = SSOSession
export default window.SSOSession
