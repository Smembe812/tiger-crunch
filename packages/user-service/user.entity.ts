function validateUser(user:UserEntityInput, validators){
	const validations = [
		function validateEmail({email}:{email:string}) : {email:string} {
			if (!email){
				throw new TypeError('email address not provided')
			}
			if (!validators.isEmail(email)){
				throw new TypeError('invalid email address provided')
			}
			return {email}
		},
		function validateName({name}:{name: string}): {name:string} {
			if (!name){
				throw new TypeError('name of user not provided')
			}
			if (!validators.isName(name)){
				throw new TypeError('invalid name provided')
			}
			return {name}
		},
		function validatePhoneNumber({phone}:{phone:string}): {phone: string} {
			if(!phone){
				throw new TypeError('user phone number not provided')
			}
			if(!validators.isPhoneNumber(phone)){
				throw new TypeError('invalid phone number')
			}
			return {phone}
		},
		function validateUUID({id}:{id:string}):{ id:string } {
			if(!id){
				throw new TypeError('uuid not provided')
			}
			if(!validators.isUUID(id)){
				throw new TypeError('invalid uuid')
			}
			return {id}
		},
		function validatePIN({proposedPIN}:{proposedPIN:string}):{ proposedPIN:string } {
			if(!proposedPIN){
				throw new TypeError('pin not provided')
			}
			if(!validators.isPIN(proposedPIN)){
				throw new TypeError('pin code must only have digits')
			}
			return {proposedPIN}
		}
	]
	const validFields = validations.map(validation => {
		return validation.call(this,user)
	})
	const validUser = Object.assign({},user, ...validFields)
	return Object.freeze(validUser)
}
export default function ({validators, identityManager}){
	return async function create(user:UserEntityInput) : Promise<User> {
		const {proposedPIN, ...validatedUser} = validateUser(user, validators)
		if(proposedPIN){
			const pin = await identityManager.computePersistedPIN(proposedPIN)
			return Object.freeze({...validatedUser, pin})
		}
		return Object.freeze({...validatedUser})
	}
}