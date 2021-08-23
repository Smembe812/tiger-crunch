export default class ErrorWrapper extends Error{
	code:string;
	description:string;
	constructor(message:string, description?:string, code=null){
		super(message)
		this.description = description
		this.code = code
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ErrorWrapper)
		}
	}
}