function RP(opFrameId,targetOrigin=null){
    this.stat = "unchanged";
    this.mes = "client_id" + " " + "session_state";
    this.targetOrigin = targetOrigin || "https://auth.tiger-crunch.com:3000"; // Validates origin
    this.opFrameId = opFrameId
    this.timerID;
    this.check_session = function check_session(opFrameId, target, message){
        const win = window.parent.frames[opFrameId].contentWindow
        // const win = window.open(target, )
        // win.onload = function (){
            win.postMessage(message, '*');
        // }
    }
    this.setTimer = function setTimer() {
        this.check_session(this.opFrameId, this.targetOrigin, this.mes);
        this.timerID = setInterval(
            this.check_session, 
            5 * 1000, 
            this.opFrameId, 
            this.targetOrigin,
            this.mes
        );
    }
    this.receiveMessage = function receiveMessage(e) {
        console.log(e.origin, this.targetOrigin)
        if (e.origin !== this.targetOrigin) {
            return;
        }
        this.stat = e.data;
        if (this.stat === "changed") {
            clearInterval(this.timerID);
            window.addEventListener("message", receiveMessage, false);
        // then take the actions below...
        }
    }
    // this.setTimer();
}
function SSOSession (){
    //TODO:
    // create iframes
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
    const rpIFrame = /*html*/`
        <iframe id="rp" style="position: absolute;width:0;height:0;border:0;" frameborder="0" seamless="seamless"></iframe>
    `
    const [subdomain, ...baseHost] = window.location.hostname.split('.')
    const domain = baseHost.join('.')
    // window.domain = domain
    console.log(window.domain)
    const iframeContainer = document.createElement("div")
    iframeContainer.innerHTML = `${rpIFrame}${opIFrame}`
    document.body.appendChild(iframeContainer)
    this.rp = new RP('op')
    this.rp.setTimer()
    this.sessionStatus = function sessionStatus(){
        return {
            status: this.rp.stat,
        }
    }
}
window.SSOSession = SSOSession
export default window.SSOSession
