export default class ErrorWrapper extends Error {
    code:string;
    constructor(message, name, code=null){
        super(message)
        this.name = name;
        this.code = code
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ErrorWrapper)
        }
    }
}