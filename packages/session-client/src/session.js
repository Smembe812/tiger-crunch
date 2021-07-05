
//TODO:
// create iframes
const opIFrame = /*html*/`
    <iframe id="op" src="https://auth.tiger-crunch.com:3000" style="position: absolute;width:0;height:0;border:0;" frameborder="0" seamless="seamless"></iframe>
`
const rpIFrame = /*html*/`
    <iframe id="rp" style="position: absolute;width:0;height:0;border:0;" frameborder="0" seamless="seamless"></iframe>
`
const iframeContainer = document.createElement("div")
iframeContainer.innerHTML = `${rpIFrame}${opIFrame}`
document.body.appendChild(iframeContainer)
function OP(){
    const win = window.parent.frames['op'].contentWindow
    window.addEventListener("message", (e) => console.log(e), false);
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
function RP(opFrameId,targetOrigin=null){
    this.stat = "unchanged";
    this.mes = "client_id" + " " + "session_state";
    this.targetOrigin = targetOrigin || "https://auth.tiger-crunch.com:3000"; // Validates origin
    this.opFrameId = opFrameId
    this.timerID;
    this.check_session = function check_session(opFrameId, target, message){
        const win = window.parent.frames[opFrameId].contentWindow
        win.postMessage(message, target);
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
    this.op = new OP()
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
